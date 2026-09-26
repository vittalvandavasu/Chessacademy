export interface ConceptNode {
  key: string;
  name: string;
  category: 'Foundations' | 'Tactics' | 'Strategy' | 'Endgames';
  difficulty: number;
  importance: number;
  prerequisites: string[]; // keys of prerequisite concepts
  relatedConcepts: string[];
}

export const CONCEPT_GRAPH: Record<string, ConceptNode> = {
  CHESS_BOARD: {
    key: 'CHESS_BOARD',
    name: 'The Chessboard & Coordinates',
    category: 'Foundations',
    difficulty: 1,
    importance: 5,
    prerequisites: [],
    relatedConcepts: ['PIECE_MOVEMENT'],
  },
  PIECE_MOVEMENT: {
    key: 'PIECE_MOVEMENT',
    name: 'Piece Movements',
    category: 'Foundations',
    difficulty: 1,
    importance: 5,
    prerequisites: ['CHESS_BOARD'],
    relatedConcepts: ['CAPTURING'],
  },
  CAPTURING: {
    key: 'CAPTURING',
    name: 'Capturing & Value',
    category: 'Foundations',
    difficulty: 1,
    importance: 5,
    prerequisites: ['PIECE_MOVEMENT'],
    relatedConcepts: ['CHECK'],
  },
  CHECK: {
    key: 'CHECK',
    name: 'Check & King Safety',
    category: 'Foundations',
    difficulty: 1,
    importance: 5,
    prerequisites: ['CAPTURING'],
    relatedConcepts: ['CHECKMATE'],
  },
  CHECKMATE: {
    key: 'CHECKMATE',
    name: 'Checkmate Mechanics',
    category: 'Foundations',
    difficulty: 2,
    importance: 5,
    prerequisites: ['CHECK'],
    relatedConcepts: ['BACK_RANK_MATE', 'STALEMATE'],
  },
  STALEMATE: {
    key: 'STALEMATE',
    name: 'Stalemate & Draws',
    category: 'Foundations',
    difficulty: 2,
    importance: 4,
    prerequisites: ['CHECKMATE'],
    relatedConcepts: ['OPPOSITION'],
  },
  PIN: {
    key: 'PIN',
    name: 'Absolute & Relative Pins',
    category: 'Tactics',
    difficulty: 2,
    importance: 5,
    prerequisites: ['CHECK', 'CAPTURING'],
    relatedConcepts: ['SKEWER', 'REMOVING_DEFENDER'],
  },
  SKEWER: {
    key: 'SKEWER',
    name: 'Skewers & X-Rays',
    category: 'Tactics',
    difficulty: 2,
    importance: 4,
    prerequisites: ['PIN'],
    relatedConcepts: ['PIN', 'DISCOVERED_ATTACK'],
  },
  FORK: {
    key: 'FORK',
    name: 'Knight & Double Forks',
    category: 'Tactics',
    difficulty: 2,
    importance: 5,
    prerequisites: ['PIECE_MOVEMENT', 'CAPTURING'],
    relatedConcepts: ['DOUBLE_ATTACK'],
  },
  BACK_RANK_MATE: {
    key: 'BACK_RANK_MATE',
    name: 'Back Rank Mates',
    category: 'Tactics',
    difficulty: 2,
    importance: 5,
    prerequisites: ['CHECKMATE'],
    relatedConcepts: ['DEFLECTION', 'CLEARANCE'],
  },
  DISCOVERED_ATTACK: {
    key: 'DISCOVERED_ATTACK',
    name: 'Discovered Attacks',
    category: 'Tactics',
    difficulty: 3,
    importance: 4,
    prerequisites: ['PIN', 'CHECK'],
    relatedConcepts: ['DOUBLE_ATTACK'],
  },
  DEFLECTION: {
    key: 'DEFLECTION',
    name: 'Deflection & Overloading',
    category: 'Tactics',
    difficulty: 3,
    importance: 4,
    prerequisites: ['PIN', 'BACK_RANK_MATE'],
    relatedConcepts: ['DECOY', 'CLEARANCE'],
  },
  CENTER_CONTROL: {
    key: 'CENTER_CONTROL',
    name: 'Center Control (e4, d4, e5, d5)',
    category: 'Strategy',
    difficulty: 2,
    importance: 4,
    prerequisites: ['PIECE_MOVEMENT'],
    relatedConcepts: ['DEVELOPMENT'],
  },
  DEVELOPMENT: {
    key: 'DEVELOPMENT',
    name: 'Rapid Development & Tempo',
    category: 'Strategy',
    difficulty: 2,
    importance: 4,
    prerequisites: ['CENTER_CONTROL'],
    relatedConcepts: ['KING_SAFETY'],
  },
  CASTLING: {
    key: 'CASTLING',
    name: 'Castling & King Safety',
    category: 'Foundations',
    difficulty: 2,
    importance: 5,
    prerequisites: ['CHECK', 'PIECE_MOVEMENT'],
    relatedConcepts: ['KING_SAFETY'],
  },
  EN_PASSANT: {
    key: 'EN_PASSANT',
    name: 'En Passant',
    category: 'Foundations',
    difficulty: 2,
    importance: 4,
    prerequisites: ['PIECE_MOVEMENT', 'CAPTURING'],
    relatedConcepts: ['PAWN_PROMOTION'],
  },
  PAWN_PROMOTION: {
    key: 'PAWN_PROMOTION',
    name: 'Pawn Promotion',
    category: 'Foundations',
    difficulty: 2,
    importance: 5,
    prerequisites: ['PIECE_MOVEMENT'],
    relatedConcepts: ['PASSED_PAWNS'],
  },
  PIECE_VALUES: {
    key: 'PIECE_VALUES',
    name: 'Piece Values & Exchanges',
    category: 'Foundations',
    difficulty: 1,
    importance: 5,
    prerequisites: ['CAPTURING'],
    relatedConcepts: ['FORK'],
  },
  SMOTHERED_MATE: {
    key: 'SMOTHERED_MATE',
    name: 'Smothered Mate',
    category: 'Tactics',
    difficulty: 3,
    importance: 4,
    prerequisites: ['FORK', 'CHECKMATE'],
    relatedConcepts: ['BACK_RANK_MATE', 'DEFLECTION'],
  },
  PASSED_PAWNS: {
    key: 'PASSED_PAWNS',
    name: 'Passed Pawns',
    category: 'Endgames',
    difficulty: 2,
    importance: 5,
    prerequisites: ['PAWN_PROMOTION', 'OPPOSITION'],
    relatedConcepts: ['OPPOSITION'],
  },
  OPPOSITION: {
    key: 'OPPOSITION',
    name: 'King Opposition & Pawns',
    category: 'Endgames',
    difficulty: 3,
    importance: 4,
    prerequisites: ['CHECKMATE', 'STALEMATE'],
    relatedConcepts: ['PASSED_PAWNS'],
  },
};

export class ConceptGraphService {
  public static getPrerequisites(conceptKey: string): string[] {
    return CONCEPT_GRAPH[conceptKey]?.prerequisites || [];
  }

  /**
   * Explores root causes: If user is struggling with concept, checks if prerequisites are weak
   */
  public static findRootWeakness(
    failedConceptKey: string,
    userMasteryMap: Record<string, number>
  ): string {
    const node = CONCEPT_GRAPH[failedConceptKey];
    if (!node || node.prerequisites.length === 0) return failedConceptKey;

    for (const prereq of node.prerequisites) {
      const prereqMastery = userMasteryMap[prereq] ?? 100;
      if (prereqMastery < 60) {
        // Root prerequisite is failing, remediate this first!
        return prereq;
      }
    }

    return failedConceptKey;
  }
}
