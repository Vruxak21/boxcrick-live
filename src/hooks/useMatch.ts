import { useState, useEffect, useCallback } from 'react';
import { Match, Player, Ball, WicketType, BowlerStats, FallOfWicket } from '@/types/match';
import { syncMatchToFirebase, getMatchFromFirebase, subscribeToMatch } from '@/lib/firebaseSync';
import { isFirebaseEnabled } from '@/lib/firebase';

const generateId = () => Math.random().toString(36).substring(2, 15);
const STORAGE_KEY = 'boxcrick_matches';
const SHARED_MATCHES_KEY = 'boxcrick_shared_matches';
const MY_MATCHES_KEY = 'boxcrick_my_matches'; // Track matches created on this device
const CLEANUP_DAYS = 7;

// Track which matches were created on this device
const getMyMatches = (): Set<string> => {
  try {
    const data = localStorage.getItem(MY_MATCHES_KEY);
    return data ? new Set(JSON.parse(data)) : new Set();
  } catch { return new Set(); }
};

const markMatchAsMine = (matchId: string) => {
  const myMatches = getMyMatches();
  myMatches.add(matchId);
  localStorage.setItem(MY_MATCHES_KEY, JSON.stringify([...myMatches]));
};

export const isMyMatch = (matchId: string): boolean => {
  return getMyMatches().has(matchId);
};

// Track which matches are shared (should sync to Firebase)
const getSharedMatches = (): Set<string> => {
  try {
    const data = localStorage.getItem(SHARED_MATCHES_KEY);
    return data ? new Set(JSON.parse(data)) : new Set();
  } catch { return new Set(); }
};

const isMatchShared = (matchId: string): boolean => {
  return getSharedMatches().has(matchId);
};

const markMatchAsShared = (matchId: string) => {
  const shared = getSharedMatches();
  shared.add(matchId);
  localStorage.setItem(SHARED_MATCHES_KEY, JSON.stringify([...shared]));
};

const getStoredMatches = (): Record<string, Match> => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch { return {}; }
};

const saveMatch = (match: Match) => {
  const matches = getStoredMatches();
  matches[match.id] = match;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(matches));
  window.dispatchEvent(new CustomEvent('matchUpdate', { detail: { matchId: match.id } }));
  
  // Auto-sync to Firebase if match is shared (happens on every ball)
  const shared = isMatchShared(match.id);
  const fbEnabled = isFirebaseEnabled();
  
  console.log(`🔍 Save match ${match.id}: shared=${shared}, firebaseEnabled=${fbEnabled}`);
  
  if (shared && fbEnabled) {
    syncMatchToFirebase(match).catch((error) => {
      console.error('❌ Failed to sync match to Firebase:', error);
    });
  }
};

// Enable Firebase sharing for a match
export const enableMatchSharing = async (matchId: string): Promise<boolean> => {
  const matches = getStoredMatches();
  const match = matches[matchId];
  if (!match) return false;
  
  if (!isFirebaseEnabled()) {
    console.error('❌ Firebase not configured. Cannot enable sharing.');
    return false;
  }
  
  console.log('🚀 Enabling sharing for match:', matchId);
  // Mark as shared and sync to Firebase
  markMatchAsShared(matchId);
  const success = await syncMatchToFirebase(match);
  if (success) {
    console.log('✅ Match sharing enabled successfully');
  }
  return success;
};

// Auto-cleanup old completed matches
export const cleanupOldMatches = () => {
  const matches = getStoredMatches();
  const now = Date.now();
  const cutoff = now - (CLEANUP_DAYS * 24 * 60 * 60 * 1000);
  
  let hasChanges = false;
  const updatedMatches: Record<string, Match> = {};
  
  Object.entries(matches).forEach(([id, match]) => {
    // Keep active/paused matches and recent completed ones
    if (match.status !== 'completed' || match.updatedAt > cutoff) {
      updatedMatches[id] = match;
    } else {
      hasChanges = true;
    }
  });
  
  if (hasChanges) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedMatches));
  }
};

export const createMatch = async (matchData: Partial<Match>): Promise<string> => {
  cleanupOldMatches(); // Cleanup on new match creation
  
  const matchId = generateId();
  const now = Date.now();
  const newMatch: Match = {
    id: matchId,
    name: matchData.name || 'New Match',
    overs: matchData.overs || 6,
    ballType: matchData.ballType || 'tennis',
    turfType: matchData.turfType || 'box',
    teamA: { name: matchData.teamA?.name || 'Team A', players: [], totalRuns: 0, totalWickets: 0, totalBalls: 0, extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0 } },
    teamB: { name: matchData.teamB?.name || 'Team B', players: [], totalRuns: 0, totalWickets: 0, totalBalls: 0, extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0 } },
    toss: { winner: null, decision: null },
    currentInnings: 1,
    battingTeam: 'A',
    bowlingTeam: 'B',
    currentBatsmen: { striker: null, nonStriker: null },
    currentBowler: null,
    balls: [],
    status: 'created',
    winner: null,
    createdAt: now,
    updatedAt: now,
    isFreeHit: false,
    fallOfWickets: { teamA: [], teamB: [] },
    bowlerStats: { teamA: {}, teamB: {} },
  };
  saveMatch(newMatch);
  markMatchAsMine(matchId); // Track that this match was created on this device
  return matchId;
};

export const getLatestUnfinishedMatch = async (): Promise<Match | null> => {
  cleanupOldMatches();
  const matches = getStoredMatches();
  const myMatches = getMyMatches();
  
  // Only show unfinished matches that were created on this device
  const unfinished = Object.values(matches)
    .filter(m => 
      ['created', 'toss', 'setup', 'live', 'innings_break'].includes(m.status) &&
      myMatches.has(m.id) // Only show my matches
    )
    .sort((a, b) => b.updatedAt - a.updatedAt);
  return unfinished[0] || null;
};

export const useMatch = (matchId: string | null, enableFirebaseSync = false) => {
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMatch = useCallback(async () => {
    if (!matchId) { setLoading(false); return; }
    
    // Try localStorage first
    const matches = getStoredMatches();
    const foundMatch = matches[matchId];
    
    if (foundMatch) {
      setMatch(foundMatch);
      setError(null);
      setLoading(false);
    } else if (enableFirebaseSync) {
      // Try Firebase if not found locally
      try {
        const firebaseMatch = await getMatchFromFirebase(matchId);
        if (firebaseMatch) {
          setMatch(firebaseMatch);
          setError(null);
        } else {
          setError('Match not found');
        }
      } catch (err) {
        setError('Match not found');
      }
      setLoading(false);
    } else {
      setError('Match not found');
      setLoading(false);
    }
  }, [matchId, enableFirebaseSync]);

  useEffect(() => {
    loadMatch();
    
    // Set up Firebase real-time listener for shared matches
    let unsubscribe: (() => void) | null = null;
    if (matchId && enableFirebaseSync && isFirebaseEnabled()) {
      unsubscribe = subscribeToMatch(
        matchId,
        (updatedMatch) => {
          setMatch(updatedMatch);
          // Also save to localStorage for offline access
          const matches = getStoredMatches();
          matches[matchId] = updatedMatch;
          localStorage.setItem(STORAGE_KEY, JSON.stringify(matches));
        },
        (error) => {
          console.error('Firebase subscription error:', error);
        }
      );
    }
    
    const handleUpdate = (e: CustomEvent) => { if (e.detail.matchId === matchId) loadMatch(); };
    window.addEventListener('matchUpdate', handleUpdate as EventListener);
    window.addEventListener('storage', loadMatch);
    
    return () => {
      window.removeEventListener('matchUpdate', handleUpdate as EventListener);
      window.removeEventListener('storage', loadMatch);
      if (unsubscribe) unsubscribe();
    };
  }, [matchId, loadMatch, enableFirebaseSync]);

  const updateMatch = useCallback(async (updates: Partial<Match>) => {
    if (!matchId || !match) return;
    const updatedMatch = { ...match, ...updates, updatedAt: Date.now() };
    saveMatch(updatedMatch);
    setMatch(updatedMatch);
  }, [matchId, match]);

  return { match, loading, error, updateMatch };
};

export const updateToss = async (matchId: string, winner: 'A' | 'B', decision: 'bat' | 'bowl') => {
  const matches = getStoredMatches();
  const match = matches[matchId];
  if (!match) return;
  const battingTeam: 'A' | 'B' = decision === 'bat' ? winner : (winner === 'A' ? 'B' : 'A');
  const bowlingTeam: 'A' | 'B' = battingTeam === 'A' ? 'B' : 'A';
  saveMatch({ ...match, toss: { winner, decision }, battingTeam, bowlingTeam, status: 'setup', updatedAt: Date.now() });
};

export const addPlayers = async (matchId: string, team: 'A' | 'B', playerNames: string[], isJoker: boolean = false) => {
  const matches = getStoredMatches();
  const match = matches[matchId];
  if (!match) return;
  const teamKey = team === 'A' ? 'teamA' : 'teamB';
  const existingPlayers = match[teamKey].players;
  const newPlayers: Player[] = playerNames.map(name => ({
    id: generateId(),
    name,
    runs: 0,
    ballsFaced: 0,
    fours: 0,
    sixes: 0,
    isOut: false,
    isJoker,
  }));
  saveMatch({
    ...match,
    [teamKey]: { ...match[teamKey], players: [...existingPlayers, ...newPlayers] },
    updatedAt: Date.now(),
  });
};

export const addJokerPlayer = async (matchId: string, jokerName: string) => {
  const matches = getStoredMatches();
  const match = matches[matchId];
  if (!match) return;
  
  const jokerId = generateId();
  const jokerPlayer: Player = {
    id: jokerId,
    name: jokerName,
    runs: 0,
    ballsFaced: 0,
    fours: 0,
    sixes: 0,
    isOut: false,
    isJoker: true,
  };
  
  // Add the same joker player object to both teams (same ID)
  saveMatch({
    ...match,
    teamA: { ...match.teamA, players: [...match.teamA.players, { ...jokerPlayer }] },
    teamB: { ...match.teamB, players: [...match.teamB.players, { ...jokerPlayer }] },
    jokerPlayerId: jokerId,
    updatedAt: Date.now(),
  });
};

export const setOpeners = async (matchId: string, strikerId: string, nonStrikerId: string, bowlerId: string) => {
  const matches = getStoredMatches();
  const match = matches[matchId];
  if (!match) return;
  
  // Initialize bowler stats
  const bowlingTeamKey = match.bowlingTeam === 'A' ? 'teamA' : 'teamB';
  const bowler = match[bowlingTeamKey].players.find(p => p.id === bowlerId);
  const bowlerStatsKey = match.bowlingTeam === 'A' ? 'teamA' : 'teamB';
  
  const newBowlerStats = { ...match.bowlerStats };
  if (bowler && !newBowlerStats[bowlerStatsKey][bowlerId]) {
    newBowlerStats[bowlerStatsKey][bowlerId] = {
      id: bowlerId,
      name: bowler.name,
      overs: 0,
      balls: 0,
      runs: 0,
      wickets: 0,
      noBalls: 0,
      wides: 0,
      extras: 0,
    };
  }
  
  saveMatch({
    ...match,
    currentBatsmen: { striker: strikerId, nonStriker: nonStrikerId },
    currentBowler: bowlerId,
    status: 'live',
    bowlerStats: newBowlerStats,
    updatedAt: Date.now(),
  });
};

interface RecordBallOptions {
  runs: number;
  extraType?: 'wide' | 'noball' | 'dead';
  isWicket?: boolean;
  wicketType?: WicketType;
  fielder?: string;
  runsOffBat?: number;
}

export const recordBall = async (matchId: string, options: RecordBallOptions) => {
  const matches = getStoredMatches();
  const match = matches[matchId];
  if (!match) return;
  
  const { runs, extraType, isWicket = false, wicketType, fielder, runsOffBat } = options;
  
  const battingTeamKey = match.battingTeam === 'A' ? 'teamA' : 'teamB';
  const bowlingTeamKey = match.bowlingTeam === 'A' ? 'teamA' : 'teamB';
  const battingTeam = match[battingTeamKey];
  const fowKey = match.battingTeam === 'A' ? 'teamA' : 'teamB';
  
  let newTotalBalls = battingTeam.totalBalls;
  let newRuns = battingTeam.totalRuns + runs;
  let newWickets = battingTeam.totalWickets;
  const newExtras = { ...battingTeam.extras };
  let setFreeHit = false;
  const wasFreeHit = match.isFreeHit;
  
  // Handle extras
  if (extraType === 'wide') {
    newRuns += 1;
    newExtras.wides += 1 + runs;
    // Wide doesn't count as a legal delivery
  } else if (extraType === 'noball') {
    newRuns += 1;
    newExtras.noBalls += 1;
    if (runsOffBat !== undefined) {
      newRuns += runsOffBat;
    }
    // No ball doesn't count as a legal delivery
    setFreeHit = true; // Next ball is free hit
  } else if (extraType !== 'dead') {
    newTotalBalls += 1;
  }
  
  // Handle wicket - but during free hit only runout is allowed
  let validWicket = isWicket;
  if (wasFreeHit && isWicket && wicketType !== 'runout') {
    validWicket = false; // Can't be out on free hit except runout
  }
  
  if (validWicket) {
    newWickets += 1;
  }
  
  // Update batsman stats
  const updatedPlayers = battingTeam.players.map(p => {
    if (p.id === match.currentBatsmen.striker) {
      const batsmanRuns = extraType === 'wide' ? 0 : (runsOffBat !== undefined ? runsOffBat : runs);
      const isFour = batsmanRuns === 4 && !extraType;
      const isSix = batsmanRuns === 6 && !extraType;
      return {
        ...p,
        runs: p.runs + batsmanRuns,
        ballsFaced: p.ballsFaced + (extraType === 'wide' ? 0 : 1),
        fours: p.fours + (isFour ? 1 : 0),
        sixes: p.sixes + (isSix ? 1 : 0),
        isOut: validWicket,
        wicketType: validWicket ? wicketType : undefined,
        fielder: validWicket && fielder ? fielder : undefined,
        bowlerWhoGotWicket: validWicket && wicketType !== 'runout' ? match.currentBowler || undefined : undefined,
        howOut: validWicket ? getHowOutText(wicketType, fielder, match[bowlingTeamKey].players.find(b => b.id === match.currentBowler)?.name) : undefined,
      };
    }
    return p;
  });
  
  // Update bowler stats
  const bowlerStats = { ...match.bowlerStats };
  const currentBowlerStats = bowlerStats[bowlingTeamKey][match.currentBowler || ''];
  if (currentBowlerStats) {
    let bowlerBalls = currentBowlerStats.balls;
    if (extraType !== 'wide' && extraType !== 'noball' && extraType !== 'dead') {
      bowlerBalls += 1;
    }
    
    bowlerStats[bowlingTeamKey][match.currentBowler || ''] = {
      ...currentBowlerStats,
      balls: bowlerBalls,
      overs: Math.floor(bowlerBalls / 6),
      runs: currentBowlerStats.runs + runs + (extraType === 'wide' || extraType === 'noball' ? 1 : 0),
      wickets: currentBowlerStats.wickets + (validWicket && wicketType !== 'runout' ? 1 : 0),
      noBalls: currentBowlerStats.noBalls + (extraType === 'noball' ? 1 : 0),
      wides: currentBowlerStats.wides + (extraType === 'wide' ? 1 : 0),
      extras: currentBowlerStats.extras + (extraType ? 1 : 0),
    };
  }
  
  // Fall of wickets
  const fallOfWickets = { ...match.fallOfWickets };
  if (validWicket) {
    const outPlayer = updatedPlayers.find(p => p.id === match.currentBatsmen.striker);
    if (outPlayer) {
      const fow: FallOfWicket = {
        playerName: outPlayer.name,
        score: newRuns,
        overs: `${Math.floor(newTotalBalls / 6)}.${newTotalBalls % 6}`,
        wicketNumber: newWickets,
      };
      fallOfWickets[fowKey] = [...fallOfWickets[fowKey], fow];
    }
  }
  
  // Handle strike rotation
  const shouldChangeStrike = (runs % 2 === 1) && !validWicket && extraType !== 'wide';
  const overComplete = newTotalBalls % 6 === 0 && newTotalBalls > 0 && newTotalBalls !== battingTeam.totalBalls;
  let [newStriker, newNonStriker] = [match.currentBatsmen.striker, match.currentBatsmen.nonStriker];
  if (shouldChangeStrike) [newStriker, newNonStriker] = [newNonStriker, newStriker];
  if (overComplete && !shouldChangeStrike) [newStriker, newNonStriker] = [newNonStriker, newStriker];
  if (overComplete && shouldChangeStrike) {} // They cancel out
  
  const ball: Ball = {
    id: generateId(),
    over: Math.floor(newTotalBalls / 6),
    ball: newTotalBalls % 6,
    runs,
    extras: extraType ? 1 : 0,
    extraType,
    isWicket: validWicket,
    wicketType: validWicket ? wicketType : undefined,
    fielder: validWicket && fielder ? fielder : undefined,
    batsmanId: match.currentBatsmen.striker || '',
    bowlerId: match.currentBowler || '',
    timestamp: Date.now(),
    isFreeHit: wasFreeHit,
    runsOffBat,
  };
  
  // Check innings/match completion
  const maxBalls = match.overs * 6;
  const allOut = newWickets >= updatedPlayers.filter(p => !p.isJoker || (p.isJoker && match.battingTeam === 'A')).length - 1;
  const inningsComplete = allOut || newTotalBalls >= maxBalls;
  
  let newStatus: Match['status'] = match.status;
  let winner = match.winner;
  let winMargin = match.winMargin;
  
  if (inningsComplete) {
    if (match.currentInnings === 1) {
      newStatus = 'innings_break';
    } else {
      newStatus = 'completed';
      const fA = match.battingTeam === 'A' ? newRuns : match.teamA.totalRuns;
      const fB = match.battingTeam === 'B' ? newRuns : match.teamB.totalRuns;
      if (fA > fB) { winner = 'A'; winMargin = `by ${fA - fB} runs`; }
      else if (fB > fA) { winner = 'B'; winMargin = match.battingTeam === 'B' ? `by ${updatedPlayers.length - 1 - newWickets} wickets` : `by ${fB - fA} runs`; }
      else { winner = 'tie'; winMargin = 'Match Tied'; }
    }
  }
  
  // Check chase completion in second innings
  if (match.currentInnings === 2 && !inningsComplete) {
    const target = match.battingTeam === 'A' ? match.teamB.totalRuns : match.teamA.totalRuns;
    if (newRuns > target) {
      newStatus = 'completed';
      winner = match.battingTeam;
      winMargin = `by ${updatedPlayers.length - 1 - newWickets} wickets`;
    }
  }
  
  // Determine if next ball is free hit
  const nextIsFreeHit = setFreeHit ? true : (wasFreeHit && extraType === 'noball' ? true : false);
  
  saveMatch({
    ...match,
    [battingTeamKey]: {
      ...battingTeam,
      players: updatedPlayers,
      totalRuns: newRuns,
      totalWickets: newWickets,
      totalBalls: newTotalBalls,
      extras: newExtras,
    },
    currentBatsmen: { striker: newStriker, nonStriker: newNonStriker },
    balls: [...match.balls, ball],
    status: newStatus,
    winner,
    winMargin,
    isFreeHit: extraType === 'dead' ? match.isFreeHit : nextIsFreeHit,
    fallOfWickets,
    bowlerStats,
    updatedAt: Date.now(),
  });
};

const getHowOutText = (wicketType?: WicketType, fielder?: string, bowlerName?: string): string => {
  if (!wicketType) return 'out';
  switch (wicketType) {
    case 'bowled': return `b ${bowlerName || ''}`;
    case 'lbw': return `lbw b ${bowlerName || ''}`;
    case 'caught': return `c ${fielder || ''} b ${bowlerName || ''}`;
    case 'runout': return `run out${fielder ? ` (${fielder})` : ''}`;
    case 'stumped': return `st ${fielder || ''} b ${bowlerName || ''}`;
    case 'hitwicket': return `hit wicket b ${bowlerName || ''}`;
    default: return 'out';
  }
};

export const selectNewBatsman = async (matchId: string, newBatsmanId: string) => {
  const matches = getStoredMatches();
  const match = matches[matchId];
  if (!match) return;
  saveMatch({ ...match, currentBatsmen: { ...match.currentBatsmen, striker: newBatsmanId }, updatedAt: Date.now() });
};

export const changeBowler = async (matchId: string, newBowlerId: string) => {
  const matches = getStoredMatches();
  const match = matches[matchId];
  if (!match) return;
  
  // Initialize bowler stats if needed
  const bowlingTeamKey = match.bowlingTeam === 'A' ? 'teamA' : 'teamB';
  const bowler = match[bowlingTeamKey].players.find(p => p.id === newBowlerId);
  const bowlerStats = { ...match.bowlerStats };
  
  if (bowler && !bowlerStats[bowlingTeamKey][newBowlerId]) {
    bowlerStats[bowlingTeamKey][newBowlerId] = {
      id: newBowlerId,
      name: bowler.name,
      overs: 0,
      balls: 0,
      runs: 0,
      wickets: 0,
      noBalls: 0,
      wides: 0,
      extras: 0,
    };
  }
  
  saveMatch({ ...match, currentBowler: newBowlerId, bowlerStats, updatedAt: Date.now() });
};

export const startSecondInnings = async (matchId: string) => {
  const matches = getStoredMatches();
  const match = matches[matchId];
  if (!match) return;
  const newBatting: 'A' | 'B' = match.battingTeam === 'A' ? 'B' : 'A';
  const newBowling: 'A' | 'B' = match.battingTeam;
  saveMatch({
    ...match,
    currentInnings: 2,
    battingTeam: newBatting,
    bowlingTeam: newBowling,
    currentBatsmen: { striker: null, nonStriker: null },
    currentBowler: null,
    status: 'setup',
    isFreeHit: false,
    updatedAt: Date.now(),
  });
};

export const addPlayersToTeam = async (matchId: string, team: 'A' | 'B', playerNames: string[]) => {
  const matches = getStoredMatches();
  const match = matches[matchId];
  if (!match) return;
  
  const teamKey = team === 'A' ? 'teamA' : 'teamB';
  const existingPlayers = match[teamKey].players;
  const newPlayers: Player[] = playerNames.map(name => ({
    id: generateId(),
    name,
    runs: 0,
    ballsFaced: 0,
    fours: 0,
    sixes: 0,
    isOut: false,
  }));
  
  saveMatch({
    ...match,
    [teamKey]: { ...match[teamKey], players: [...existingPlayers, ...newPlayers] },
    updatedAt: Date.now(),
  });
};

export const updateTeamPlayers = async (matchId: string, team: 'A' | 'B', playerNames: string[]) => {
  const matches = getStoredMatches();
  const match = matches[matchId];
  if (!match) return;
  
  const teamKey = team === 'A' ? 'teamA' : 'teamB';
  const existingPlayers = match[teamKey].players;
  
  // Keep stats for existing players if name matches
  const updatedPlayers: Player[] = playerNames.map(name => {
    const existing = existingPlayers.find(p => p.name === name && !p.isJoker);
    if (existing) {
      return existing; // Keep existing player with stats
    }
    // Create new player
    return {
      id: generateId(),
      name,
      runs: 0,
      ballsFaced: 0,
      fours: 0,
      sixes: 0,
      isOut: false,
    };
  });
  
  // Keep joker if exists
  const joker = existingPlayers.find(p => p.isJoker);
  if (joker) {
    updatedPlayers.push(joker);
  }
  
  saveMatch({
    ...match,
    [teamKey]: { ...match[teamKey], players: updatedPlayers },
    updatedAt: Date.now(),
  });
};

export const restartMatch = async (matchId: string): Promise<void> => {
  const matches = getStoredMatches();
  const match = matches[matchId];
  if (!match) return;
  
  // Reset all scores but keep team names and player names
  const resetPlayers = (players: Player[]): Player[] => 
    players.map(p => ({
      ...p,
      runs: 0,
      ballsFaced: 0,
      fours: 0,
      sixes: 0,
      isOut: false,
      howOut: undefined,
      wicketType: undefined,
      fielder: undefined,
      bowlerWhoGotWicket: undefined,
    }));
  
  const resetMatch: Match = {
    ...match,
    teamA: {
      ...match.teamA,
      players: resetPlayers(match.teamA.players),
      totalRuns: 0,
      totalWickets: 0,
      totalBalls: 0,
      extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0 },
    },
    teamB: {
      ...match.teamB,
      players: resetPlayers(match.teamB.players),
      totalRuns: 0,
      totalWickets: 0,
      totalBalls: 0,
      extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0 },
    },
    toss: { winner: null, decision: null },
    currentInnings: 1,
    battingTeam: 'A',
    bowlingTeam: 'B',
    currentBatsmen: { striker: null, nonStriker: null },
    currentBowler: null,
    balls: [],
    status: 'toss',
    winner: null,
    winMargin: undefined,
    isFreeHit: false,
    fallOfWickets: { teamA: [], teamB: [] },
    bowlerStats: { teamA: {}, teamB: {} },
    updatedAt: Date.now(),
  };
  
  saveMatch(resetMatch);
};

export const deleteMatch = async (matchId: string): Promise<void> => {
  const matches = getStoredMatches();
  delete matches[matchId];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(matches));
};

// Add player during live match
export const addPlayerDuringMatch = async (matchId: string, team: 'A' | 'B', playerName: string) => {
  const matches = getStoredMatches();
  const match = matches[matchId];
  if (!match || !['live', 'innings_break'].includes(match.status)) return;
  
  const teamKey = team === 'A' ? 'teamA' : 'teamB';
  const newPlayer: Player = {
    id: generateId(),
    name: playerName,
    runs: 0,
    ballsFaced: 0,
    fours: 0,
    sixes: 0,
    isOut: false,
  };
  
  saveMatch({
    ...match,
    [teamKey]: { ...match[teamKey], players: [...match[teamKey].players, newPlayer] },
    updatedAt: Date.now(),
  });
};

// Delete player during live match (only if not active)
export const deletePlayerDuringMatch = async (matchId: string, team: 'A' | 'B', playerId: string): Promise<{ success: boolean; error?: string }> => {
  const matches = getStoredMatches();
  const match = matches[matchId];
  if (!match) return { success: false, error: 'Match not found' };
  
  // Check if player is currently active
  if (match.currentBatsmen.striker === playerId || match.currentBatsmen.nonStriker === playerId) {
    return { success: false, error: 'Cannot delete player who is currently batting' };
  }
  if (match.currentBowler === playerId) {
    return { success: false, error: 'Cannot delete player who is currently bowling' };
  }
  
  const teamKey = team === 'A' ? 'teamA' : 'teamB';
  const updatedPlayers = match[teamKey].players.filter(p => p.id !== playerId);
  
  // Must have at least 2 players
  if (updatedPlayers.length < 2) {
    return { success: false, error: 'Team must have at least 2 players' };
  }
  
  saveMatch({
    ...match,
    [teamKey]: { ...match[teamKey], players: updatedPlayers },
    updatedAt: Date.now(),
  });
  
  return { success: true };
};
