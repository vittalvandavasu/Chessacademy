import { prisma } from './prisma';
import { AuthService } from '../services/authService';
import { CONCEPT_GRAPH } from '../services/conceptGraphService';
import { CURRICULUM_DATA } from '../../data/curriculumData';
import { PUZZLES_DATA } from '../../data/puzzlesData';

export async function seedDatabase() {
  console.log('--- SEEDING CHESSCADET PRODUCTION DATABASE ---');

  // 1. Seed Concepts
  for (const node of Object.values(CONCEPT_GRAPH)) {
    await prisma.concept.upsert({
      where: { key: node.key },
      create: {
        key: node.key,
        name: node.name,
        category: node.category,
        difficulty: node.difficulty,
        importance: node.importance,
        prerequisites: JSON.stringify(node.prerequisites),
        description: `Mastery of ${node.name} concepts and patterns.`,
      },
      update: {
        name: node.name,
        category: node.category,
      },
    });
  }
  console.log('✓ Concepts seeded');

  // 2. Seed Default Accounts
  const student = await AuthService.getOrCreateDemoUser('STUDENT');
  const teacher = await AuthService.getOrCreateDemoUser('TEACHER');
  const admin = await AuthService.getOrCreateDemoUser('ADMIN');
  console.log('✓ Users & Profiles seeded (Student, Teacher, Admin)');

  // 3. Seed Classroom & Students
  const classroom = await prisma.classroom.upsert({
    where: { joinCode: 'CHESS-7842' },
    create: {
      id: 'class-demo-1',
      teacherId: teacher.id,
      name: 'Grandmaster Club · Grade 8',
      joinCode: 'CHESS-7842',
    },
    update: {},
  });

  await prisma.classroomMember.upsert({
    where: { classroomId_studentId: { classroomId: classroom.id, studentId: student.id } },
    create: { classroomId: classroom.id, studentId: student.id },
    update: {},
  });
  console.log('✓ Classroom seeded');

  // 4. Seed Curriculum Paths, Modules, Lessons, and Exercises
  for (const p of CURRICULUM_DATA) {
    await prisma.learningPath.upsert({
      where: { id: p.id },
      create: {
        id: p.id,
        title: p.title,
        subtitle: p.subtitle,
        description: p.description,
        difficultyLevel: p.level,
        displayOrder: p.order,
        badgeId: p.badgeId,
      },
      update: {
        title: p.title,
        description: p.description,
      },
    });

    for (const m of p.modules) {
      await prisma.module.upsert({
        where: { id: m.id },
        create: {
          id: m.id,
          pathId: p.id,
          title: m.title,
          description: m.description,
          displayOrder: m.order,
        },
        update: {
          title: m.title,
        },
      });

      for (const l of m.lessons) {
        await prisma.lesson.upsert({
          where: { id: l.id },
          create: {
            id: l.id,
            moduleId: m.id,
            title: l.title,
            description: l.description,
            conceptKey: l.concept,
            estimatedMinutes: l.estimatedMinutes,
            xpReward: l.xpReward,
            displayOrder: l.order,
          },
          update: {
            title: l.title,
          },
        });

        for (const sec of l.sections) {
          for (const ex of sec.exercises) {
            await prisma.exercise.upsert({
              where: { id: ex.id },
              create: {
                id: ex.id,
                lessonId: l.id,
                conceptKey: ex.concept,
                exerciseType: ex.type,
                difficulty: ex.difficulty,
                fen: ex.fen,
                targetMoves: JSON.stringify(ex.targetMoves),
                solutionSequence: ex.solutionSequence ? JSON.stringify(ex.solutionSequence) : null,
                conceptHint: ex.conceptHint,
                areaHint: ex.areaHint,
                pieceHint: ex.pieceHint,
                moveHint: ex.moveHint,
                explanation: ex.explanation,
                xp: ex.xp,
                status: 'VERIFIED',
              },
              update: {
                fen: ex.fen,
                targetMoves: JSON.stringify(ex.targetMoves),
              },
            });
          }
        }
      }
    }
  }
  console.log('✓ Curriculum paths, modules, lessons, and exercises seeded');

  // 5. Seed Verified Puzzle Bank
  for (const puz of PUZZLES_DATA) {
    await prisma.exercise.upsert({
      where: { id: puz.id },
      create: {
        id: puz.id,
        conceptKey: puz.concept,
        exerciseType: puz.type,
        difficulty: puz.difficulty,
        fen: puz.fen,
        targetMoves: JSON.stringify(puz.targetMoves),
        solutionSequence: puz.solutionSequence ? JSON.stringify(puz.solutionSequence) : null,
        conceptHint: puz.conceptHint,
        areaHint: puz.areaHint,
        pieceHint: puz.pieceHint,
        moveHint: puz.moveHint,
        explanation: puz.explanation,
        xp: puz.xp,
        status: 'VERIFIED',
      },
      update: {
        fen: puz.fen,
        targetMoves: JSON.stringify(puz.targetMoves),
      },
    });
  }
  console.log('✓ Tactical puzzle bank seeded');

  console.log('=== DATABASE SEED COMPLETED SUCCESSFULLY ===');
}

// Execute if run directly
if (process.argv[1]?.endsWith('seed.ts')) {
  seedDatabase()
    .catch((err) => {
      console.error('Seed failed:', err);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
