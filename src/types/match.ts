export type WicketType = 'bowled' | 'lbw' | 'caught' | 'runout' | 'stumped' | 'hitwicket';

export interface Player {
  id: string;
  name: string;
  runs: number;
  ballsFaced: number;
  fours: number;
  sixes: number;
  isOut: boolean;
  howOut?: string;
  wicketType?: WicketType;
  fielder?: string;
  bowlerWhoGotWicket?: string;
  isOnStrike?: boolean;
  isJoker?: boolean;
}

export interface BowlerStats {
  id: string;
  name: string;
  overs: number;
  balls: number;
  runs: number;
  wickets: number;
  noBalls: number;
  wides: number;
  extras: number;
}

export interface Team {
  name: string;
  players: Player[];
  totalRuns: number;
  totalWickets: number;
  totalBalls: number;
  extras: {
    wides: number;
    noBalls: number;
    byes: number;
    legByes: number;
  };
}

export interface Ball {
  id: string;
  over: number;
  ball: number;
  runs: number;
  extras: number;
  extraType?: 'wide' | 'noball' | 'bye' | 'legbye' | 'dead';
  isWicket: boolean;
  wicketType?: WicketType;
  fielder?: string;
  batsmanId: string;
  bowlerId: string;
  timestamp: number;
  isFreeHit?: boolean;
  runsOffBat?: number;
}

export interface FallOfWicket {
  playerName: string;
  score: number;
  overs: string;
  wicketNumber: number;
}

export interface Match {
  id: string;
  name: string;
  overs: number;
  ballType: 'tennis' | 'leather';
  turfType: 'box' | 'turf';
  teamA: Team;
  teamB: Team;
  toss: {
    winner: 'A' | 'B' | null;
    decision: 'bat' | 'bowl' | null;
  };
  currentInnings: 1 | 2;
  battingTeam: 'A' | 'B';
  bowlingTeam: 'A' | 'B';
  currentBatsmen: {
    striker: string | null;
    nonStriker: string | null;
  };
  currentBowler: string | null;
  balls: Ball[];
  status: 'created' | 'toss' | 'setup' | 'live' | 'innings_break' | 'completed';
  winner: 'A' | 'B' | 'tie' | null;
  winMargin?: string;
  createdAt: number;
  updatedAt: number;
  isFreeHit?: boolean;
  jokerPlayerId?: string;
  fallOfWickets: {
    teamA: FallOfWicket[];
    teamB: FallOfWicket[];
  };
  bowlerStats: {
    teamA: Record<string, BowlerStats>;
    teamB: Record<string, BowlerStats>;
  };
}

export type MatchStatus = Match['status'];
