export type OfficePeriod = 
  | "morning_prep" 
  | "morning_standup" 
  | "deep_work_1" 
  | "lunch_break" 
  | "deep_work_2" 
  | "afternoon_sync" 
  | "wrap_up" 
  | "night_shift";

export interface ScheduleEvent {
  startHour: number;
  endHour: number;
  period: OfficePeriod;
  label: string;
  suggestedZones: Record<string, string>; // agentId -> zoneId
  defaultActivity: string;
}

export const OFFICE_SCHEDULE: ScheduleEvent[] = [
  {
    startHour: 8,
    endHour: 10,
    period: "morning_prep",
    label: "Morning Prep",
    suggestedZones: {
      frontdesk: "lobby",
      leslieclaw: "executive",
    },
    defaultActivity: "Getting ready for the day"
  },
  {
    startHour: 10,
    endHour: 11,
    period: "morning_standup",
    label: "Daily Standup",
    suggestedZones: {
      all: "conference"
    },
    defaultActivity: "Syncing on tasks"
  },
  {
    startHour: 11,
    endHour: 13,
    period: "deep_work_1",
    label: "Deep Work I",
    suggestedZones: {
      ironclaw: "dataNodes",
      zeroclaw: "zeroClaw",
      sherlock: "sherlock",
      hermitclaw: "archives",
    },
    defaultActivity: "Focused execution"
  },
  {
    startHour: 13,
    endHour: 14,
    period: "lunch_break",
    label: "Lunch Break",
    suggestedZones: {
      all: "kitchen"
    },
    defaultActivity: "Recharging"
  },
  {
    startHour: 14,
    endHour: 16,
    period: "deep_work_2",
    label: "Deep Work II",
    suggestedZones: {
      openclaw: "openOffice",
      leslieclaw: "executive",
    },
    defaultActivity: "Afternoon productivity"
  },
  {
    startHour: 16,
    endHour: 17,
    period: "afternoon_sync",
    label: "Afternoon Sync",
    suggestedZones: {
      all: "conference"
    },
    defaultActivity: "Reviewing progress"
  },
  {
    startHour: 17,
    endHour: 19,
    period: "wrap_up",
    label: "Wrap Up",
    suggestedZones: {
      all: "lobby"
    },
    defaultActivity: "Documenting and leaving"
  },
  {
    startHour: 19,
    endHour: 24,
    period: "night_shift",
    label: "Night Shift",
    suggestedZones: {
      hermitclaw: "archives",
      ironclaw: "missionControl",
    },
    defaultActivity: "Overnight monitoring"
  },
  {
    startHour: 0,
    endHour: 8,
    period: "night_shift",
    label: "Night Shift",
    suggestedZones: {
      hermitclaw: "archives",
    },
    defaultActivity: "System maintenance"
  }
];

export function getPeriodForHour(hour: number): ScheduleEvent {
  return OFFICE_SCHEDULE.find(e => hour >= e.startHour && hour < e.endHour) || OFFICE_SCHEDULE[0];
}
