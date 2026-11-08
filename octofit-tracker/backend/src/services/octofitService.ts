import mongoose from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

function createHttpError(message: string, status: number) {
  return Object.assign(new Error(message), { status });
}

function normalizeEmail(email: string) {
  return String(email ?? '').trim().toLowerCase();
}

function toObjectId(value: unknown) {
  if (typeof value === 'string' && mongoose.isValidObjectId(value)) {
    return new mongoose.Types.ObjectId(value);
  }
  return null;
}

export async function listActivities() {
  return Activity.find().sort({ occurredAt: -1 }).lean();
}

export async function createActivity(input: unknown) {
  if (!input || typeof input !== 'object') {
    throw createHttpError('Activity data is required', 400);
  }

  const record = input as Record<string, unknown>;
  const userId = toObjectId(record.userId);
  const teamId = toObjectId(record.teamId);

  if (!userId || !teamId) {
    throw createHttpError('Valid userId and teamId are required', 400);
  }

  const user = await User.findById(userId);
  const team = await Team.findById(teamId);

  if (!user || !team) {
    throw createHttpError('User or team not found', 404);
  }

  const type = typeof record.type === 'string' ? record.type.trim() : '';
  const minutesValue = Number(record.minutes);
  const providedPoints = Number(record.points);

  if (!type || !Number.isFinite(minutesValue) || minutesValue <= 0) {
    throw createHttpError('Activity type and positive minutes are required', 400);
  }

  const points = Number.isFinite(providedPoints) && providedPoints >= 0 ? providedPoints : Math.max(1, Math.round(minutesValue));
  const activity = await Activity.create({
    user: user._id,
    team: team._id,
    type,
    minutes: minutesValue,
    points,
    occurredAt: new Date(),
  });

  await Team.updateOne({ _id: team._id }, { $addToSet: { members: user._id } });
  if (user.team?.toString() !== team._id.toString()) {
    await User.updateOne({ _id: user._id }, { $set: { team: team._id } });
  }

  return activity.toObject();
}

export async function listTeams() {
  return Team.find().sort({ name: 1 }).lean();
}

export async function createTeam(input: unknown) {
  if (!input || typeof input !== 'object') {
    throw createHttpError('Team data is required', 400);
  }

  const record = input as Record<string, unknown>;
  const name = typeof record.name === 'string' ? record.name.trim() : '';
  const mascot = typeof record.mascot === 'string' ? record.mascot.trim() : '';

  if (!name) {
    throw createHttpError('Team name is required', 400);
  }
  if (!mascot) {
    throw createHttpError('Team mascot is required', 400);
  }

  const rawMembers = Array.isArray(record.members) ? record.members : [];
  const members = rawMembers.map((member) => String(member)).filter((member) => mongoose.isValidObjectId(member));
  if (members.length !== rawMembers.length) {
    throw createHttpError('Each team member must be a valid ObjectId', 400);
  }

  const team = await Team.create({ name, mascot, members });
  return team.toObject();
}

export async function getLeaderboard() {
  const teamTotals = await Activity.aggregate([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    { $sort: { totalPoints: -1, _id: 1 } },
  ]);

  if (teamTotals.length === 0) {
    return [];
  }

  const teamIds = teamTotals.map((entry) => entry._id);
  const teams = await Team.find({ _id: { $in: teamIds } }).lean();
  const teamMap = new Map(teams.map((team) => [team._id.toString(), team]));

  return teamTotals
    .map((entry) => ({
      teamName: teamMap.get(entry._id.toString())?.name ?? 'Unknown team',
      totalPoints: Number(entry.totalPoints) || 0,
    }))
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const email = normalizeEmail(userEmail);
  const user = await User.findOne({ email }).lean();

  if (!user) {
    throw createHttpError('User not found', 404);
  }

  const focusCandidates = new Set<string>();
  const goal = typeof user.fitnessGoal === 'string' ? user.fitnessGoal.trim() : '';
  if (goal) {
    focusCandidates.add(goal.toLowerCase());
  }

  const recentActivities = await Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(5).lean();
  const latestType = recentActivities[0]?.type ? String(recentActivities[0].type).toLowerCase() : '';

  if (latestType === 'run') focusCandidates.add('endurance');
  if (latestType === 'strength') focusCandidates.add('strength');
  if (latestType === 'cycle') focusCandidates.add('cardio');
  if (latestType === 'walk') focusCandidates.add('mobility');

  const preferredFocus = [...focusCandidates].find(Boolean) ?? 'endurance';

  const workouts = await Workout.find({
    focus: { $regex: new RegExp(preferredFocus, 'i') },
  }).sort({ minutes: 1 }).limit(5).lean();

  const fallbackWorkouts = workouts.length > 0 ? workouts : await Workout.find().sort({ minutes: 1 }).limit(5).lean();

  return fallbackWorkouts.map((workout) => ({
    ...workout,
    reason: `Your recent activity pattern and goal suggest a ${String(workout.focus).toLowerCase()} workout, especially ${latestType || goal || 'your priorities'}.`,
  }));
}

export { User };
