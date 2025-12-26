import { useState, useEffect, useCallback } from 'react';
import { Match, Player, Ball } from '@/types/match';

const generateId = () => Math.random().toString(36).substring(2, 15);
const STORAGE_KEY = 'boxcrick_matches';

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
};

export const createMatch = async (matchData: Partial<Match>): Promise<string> => {
  const matchId = generateId();
  const now = Date.now();
  const newMatch: Match = {
    id: matchId, name: matchData.name || 'New Match', overs: matchData.overs || 6,
    ballType: matchData.ballType || 'tennis', turfType: matchData.turfType || 'box',
    teamA: { name: matchData.teamA?.name || 'Team A', players: [], totalRuns: 0, totalWickets: 0, totalBalls: 0, extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0 } },
    teamB: { name: matchData.teamB?.name || 'Team B', players: [], totalRuns: 0, totalWickets: 0, totalBalls: 0, extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0 } },
    toss: { winner: null, decision: null }, currentInnings: 1, battingTeam: 'A', bowlingTeam: 'B',
    currentBatsmen: { striker: null, nonStriker: null }, currentBowler: null, balls: [],
    status: 'created', winner: null, createdAt: now, updatedAt: now,
  };
  saveMatch(newMatch);
  return matchId;
};

export const getLatestUnfinishedMatch = async (): Promise<Match | null> => {
  const matches = getStoredMatches();
  const unfinished = Object.values(matches)
    .filter(m => ['created', 'toss', 'setup', 'live', 'innings_break'].includes(m.status))
    .sort((a, b) => b.updatedAt - a.updatedAt);
  return unfinished[0] || null;
};

export const useMatch = (matchId: string | null) => {
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMatch = useCallback(() => {
    if (!matchId) { setLoading(false); return; }
    const matches = getStoredMatches();
    const foundMatch = matches[matchId];
    if (foundMatch) { setMatch(foundMatch); setError(null); }
    else { setError('Match not found'); }
    setLoading(false);
  }, [matchId]);

  useEffect(() => {
    loadMatch();
    const handleUpdate = (e: CustomEvent) => { if (e.detail.matchId === matchId) loadMatch(); };
    window.addEventListener('matchUpdate', handleUpdate as EventListener);
    window.addEventListener('storage', loadMatch);
    return () => {
      window.removeEventListener('matchUpdate', handleUpdate as EventListener);
      window.removeEventListener('storage', loadMatch);
    };
  }, [matchId, loadMatch]);

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

export const addPlayers = async (matchId: string, team: 'A' | 'B', playerNames: string[]) => {
  const matches = getStoredMatches();
  const match = matches[matchId];
  if (!match) return;
  const teamKey = team === 'A' ? 'teamA' : 'teamB';
  const players: Player[] = playerNames.map(name => ({ id: generateId(), name, runs: 0, ballsFaced: 0, isOut: false }));
  saveMatch({ ...match, [teamKey]: { ...match[teamKey], players }, updatedAt: Date.now() });
};

export const setOpeners = async (matchId: string, strikerId: string, nonStrikerId: string, bowlerId: string) => {
  const matches = getStoredMatches();
  const match = matches[matchId];
  if (!match) return;
  saveMatch({ ...match, currentBatsmen: { striker: strikerId, nonStriker: nonStrikerId }, currentBowler: bowlerId, status: 'live', updatedAt: Date.now() });
};

export const recordBall = async (matchId: string, runs: number, extraType?: 'wide' | 'noball' | 'dead', isWicket: boolean = false) => {
  const matches = getStoredMatches();
  const match = matches[matchId];
  if (!match) return;
  const battingTeamKey = match.battingTeam === 'A' ? 'teamA' : 'teamB';
  const battingTeam = match[battingTeamKey];
  let newTotalBalls = battingTeam.totalBalls;
  let newRuns = battingTeam.totalRuns + runs;
  let newWickets = battingTeam.totalWickets;
  const newExtras = { ...battingTeam.extras };
  if (extraType === 'wide') { newRuns += 1; newExtras.wides += 1 + runs; }
  else if (extraType === 'noball') { newRuns += 1; newExtras.noBalls += 1; newTotalBalls += 1; }
  else if (extraType !== 'dead') { newTotalBalls += 1; }
  if (isWicket) newWickets += 1;
  const updatedPlayers = battingTeam.players.map(p => p.id === match.currentBatsmen.striker ? { ...p, runs: p.runs + (extraType === 'wide' ? 0 : runs), ballsFaced: p.ballsFaced + (extraType === 'wide' ? 0 : 1), isOut: isWicket } : p);
  const shouldChangeStrike = (runs % 2 === 1) && !isWicket && extraType !== 'wide';
  const overComplete = newTotalBalls % 6 === 0 && newTotalBalls > 0;
  let [newStriker, newNonStriker] = [match.currentBatsmen.striker, match.currentBatsmen.nonStriker];
  if (shouldChangeStrike || overComplete) [newStriker, newNonStriker] = [newNonStriker, newStriker];
  const ball: Ball = { id: generateId(), over: Math.floor(newTotalBalls / 6), ball: newTotalBalls % 6, runs, extras: extraType ? 1 : 0, extraType, isWicket, batsmanId: match.currentBatsmen.striker || '', bowlerId: match.currentBowler || '', timestamp: Date.now() };
  const maxBalls = match.overs * 6;
  const allOut = newWickets >= updatedPlayers.length - 1;
  const inningsComplete = allOut || newTotalBalls >= maxBalls;
  let newStatus: Match['status'] = match.status;
  let winner = match.winner;
  let winMargin = match.winMargin;
  if (inningsComplete) {
    if (match.currentInnings === 1) newStatus = 'innings_break';
    else {
      newStatus = 'completed';
      const fA = match.battingTeam === 'A' ? newRuns : match.teamA.totalRuns;
      const fB = match.battingTeam === 'B' ? newRuns : match.teamB.totalRuns;
      if (fA > fB) { winner = 'A'; winMargin = `by ${fA - fB} runs`; }
      else if (fB > fA) { winner = 'B'; winMargin = match.battingTeam === 'B' ? `by ${updatedPlayers.length - 1 - newWickets} wickets` : `by ${fB - fA} runs`; }
      else { winner = 'tie'; winMargin = 'Match Tied'; }
    }
  }
  if (match.currentInnings === 2 && !inningsComplete) {
    const target = match.battingTeam === 'A' ? match.teamB.totalRuns : match.teamA.totalRuns;
    if (newRuns > target) { newStatus = 'completed'; winner = match.battingTeam; winMargin = `by ${updatedPlayers.length - 1 - newWickets} wickets`; }
  }
  saveMatch({ ...match, [battingTeamKey]: { ...battingTeam, players: updatedPlayers, totalRuns: newRuns, totalWickets: newWickets, totalBalls: newTotalBalls, extras: newExtras }, currentBatsmen: { striker: newStriker, nonStriker: newNonStriker }, balls: [...match.balls, ball], status: newStatus, winner, winMargin, updatedAt: Date.now() });
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
  saveMatch({ ...match, currentBowler: newBowlerId, updatedAt: Date.now() });
};

export const startSecondInnings = async (matchId: string) => {
  const matches = getStoredMatches();
  const match = matches[matchId];
  if (!match) return;
  const newBatting: 'A' | 'B' = match.battingTeam === 'A' ? 'B' : 'A';
  const newBowling: 'A' | 'B' = match.battingTeam;
  saveMatch({ ...match, currentInnings: 2, battingTeam: newBatting, bowlingTeam: newBowling, currentBatsmen: { striker: null, nonStriker: null }, currentBowler: null, status: 'setup', updatedAt: Date.now() });
};
