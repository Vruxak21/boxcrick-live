export interface Player {
  id: string;
  name: string;
  runs: number;
  ballsFaced: number;
  isOut: boolean;
  howOut?: string;
  isOnStrike?: boolean;
}

export interface BowlerStats {
  id: string;
  name: string;
  overs: number;
  balls: number;
  runs: number;
  wickets: number;
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
  batsmanId: string;
  bowlerId: string;
  timestamp: number;
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
}

export type MatchStatus = Match['status'];
