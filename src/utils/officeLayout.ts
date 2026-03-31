export type RoomId = string;
export type ObjectId = string;

export type OfficeObject = {
  id: ObjectId;
  roomId: RoomId;
  type: string;
  spriteId: string;
  x: number; // relative to room
  y: number; // relative to room
  width?: number;
  height?: number;
  rotation?: number;
  zIndex?: number;
  label?: string;
  props?: Record<string, any>;
};

export const OFFICE_LAYOUT: { objects: OfficeObject[] } = {
  objects: [
    // LeslieClaw - Executive Suite (col 0, row 0)
    { id: "leslie_rug", roomId: "executive", type: "rug", spriteId: "rug_work", x: 20, y: 0, width: 200, height: 60 },
    { id: "leslie_desk", roomId: "executive", type: "desk", spriteId: "desk_wood", x: 60, y: 0, width: 120, height: 60, label: "Leslie's Desk" },
    { id: "leslie_bookshelf", roomId: "executive", type: "bookshelf", spriteId: "bookshelf_tall", x: 15, y: 0, width: 40, height: 100 },
    { id: "leslie_guitar", roomId: "executive", type: "guitar_stand", spriteId: "guitar_stand", x: 190, y: 0, width: 30, height: 50 },
    { id: "leslie_lamp", roomId: "executive", type: "lamp", spriteId: "lamp_floor", x: 210, y: 0, width: 10, height: 80 },

    // Sherlock - Systems Detective Office (col 1, row 0)
    { id: "sherlock_rug", roomId: "sherlock", type: "rug", spriteId: "rug_persian", x: 30, y: 0, width: 180, height: 50 },
    { id: "sherlock_desk", roomId: "sherlock", type: "desk", spriteId: "desk_dark", x: 70, y: 0, width: 100, height: 50, label: "Sherlock's Desk" },
    { id: "sherlock_art", roomId: "sherlock", type: "painting", spriteId: "art_abstract", x: 20, y: 30, width: 50, height: 40 },
    { id: "sherlock_side_table", roomId: "sherlock", type: "table", spriteId: "table_small", x: 180, y: 0, width: 40, height: 40 },
    { id: "sherlock_carafe", roomId: "sherlock", type: "accessory", spriteId: "carafe", x: 195, y: 120, width: 10, height: 15 },
    { id: "sherlock_lamp", roomId: "sherlock", type: "lamp", spriteId: "lamp_warm", x: 10, y: 0, width: 10, height: 80 },

    // ZeroClaw - Sandbox / Testing (col 2, row 0)
    { id: "zeroclaw_desk", roomId: "zeroClaw", type: "desk", spriteId: "desk_lab", x: 60, y: 0, width: 120, height: 40 },
    { id: "zeroclaw_monitor_1", roomId: "zeroClaw", type: "monitor", spriteId: "monitor_tall", x: 70, y: 80, width: 30, height: 50 },
    { id: "zeroclaw_monitor_2", roomId: "zeroClaw", type: "monitor", spriteId: "monitor_tall", x: 105, y: 70, width: 30, height: 60 },
    { id: "zeroclaw_monitor_3", roomId: "zeroClaw", type: "monitor", spriteId: "monitor_tall", x: 140, y: 80, width: 30, height: 50 },

    // Sherlobster - Strategy Room (col 1, row 2)
    { id: "sherlobster_table", roomId: "sherlobster", type: "table", spriteId: "table_oval", x: 50, y: 0, width: 140, height: 80 },
    { id: "sherlobster_kanban", roomId: "sherlobster", type: "whiteboard", spriteId: "kanban_board", x: 180, y: 30, width: 50, height: 60 },

    // Hercule - War Room (col 3, row 1)
    { id: "hercule_desk", roomId: "warRoom", type: "desk", spriteId: "desk_investigation", x: 30, y: 0, width: 180, height: 50 },
    { id: "hercule_whiteboard", roomId: "warRoom", type: "whiteboard", spriteId: "investigation_board", x: 40, y: 30, width: 160, height: 50 },

    // HermitClaw - Archives (col 4, row 1)
    { id: "archives_shelf_1", roomId: "archives", type: "bookshelf", spriteId: "bookshelf_archive_l", x: 10, y: 0, width: 50, height: 180 },
    { id: "archives_shelf_2", roomId: "archives", type: "bookshelf", spriteId: "bookshelf_archive_b", x: 70, y: 0, width: 160, height: 120 },
    { id: "archives_desk", roomId: "archives", type: "desk", spriteId: "desk_archive", x: 100, y: 0, width: 80, height: 45 },

    // IronClaw - Data Nodes (col 3, row 2)
    { id: "datanodes_rack_1", roomId: "dataNodes", type: "server_rack", spriteId: "server_rack", x: 30, y: 0, width: 60, height: 140 },
    { id: "datanodes_rack_2", roomId: "dataNodes", type: "server_rack", spriteId: "server_rack", x: 100, y: 0, width: 60, height: 140 },
    { id: "datanodes_rack_3", roomId: "dataNodes", type: "server_rack", spriteId: "server_rack", x: 170, y: 0, width: 60, height: 140 },

    // OpenClaw - Open Office (col 1, row 1, width 2 cells)
    { id: "openoffice_desk_1", roomId: "openOffice", type: "desk", spriteId: "desk_group", x: 40, y: 0, width: 400, height: 60 },

    // FrontDesk - Lobby (col 0, row 1)
    { id: "lobby_desk", roomId: "lobby", type: "desk", spriteId: "desk_reception", x: 20, y: 0, width: 200, height: 60 },

    // Kitchen (col 4, row 0)
    { id: "kitchen_counter", roomId: "kitchen", type: "counter", spriteId: "counter_stone", x: 20, y: 0, width: 200, height: 40 },
    { id: "kitchen_fridge", roomId: "kitchen", type: "fridge", spriteId: "fridge_tall", x: 180, y: 0, width: 50, height: 120 },
    { id: "kitchen_coffee", roomId: "kitchen", type: "accessory", spriteId: "coffee_machine", x: 40, y: 130, width: 30, height: 25 },

    // Gym (col 0, row 2)
    { id: "gym_mat", roomId: "gym", type: "mat", spriteId: "yoga_mat", x: 20, y: 0, width: 200, height: 60 },
    { id: "gym_cooler", roomId: "gym", type: "water_cooler", spriteId: "water_cooler", x: 20, y: 150, width: 25, height: 50 },
    { id: "gym_dumbbells", roomId: "gym", type: "accessory", spriteId: "dumbbells", x: 200, y: 130, width: 20, height: 15 },
    { id: "gym_pullup", roomId: "gym", type: "pull_up_bar", spriteId: "pullup_bar", x: 70, y: 40, width: 100, height: 20 },

    // Conference Room (col 3, row 0) - 8 agents around table facing monitor
    { id: "conference_table", roomId: "conference", type: "table", spriteId: "table_oval", x: 60, y: 90, width: 120, height: 70 },
    // 8 chairs arranged around the table (facing the monitor at top)
    // Top row (facing monitor) - 3 chairs
    { id: "conference_chair_1", roomId: "conference", type: "chair", spriteId: "chair_office", x: 30, y: 55, width: 25, height: 25 },
    { id: "conference_chair_2", roomId: "conference", type: "chair", spriteId: "chair_office", x: 80, y: 55, width: 25, height: 25 },
    { id: "conference_chair_3", roomId: "conference", type: "chair", spriteId: "chair_office", x: 130, y: 55, width: 25, height: 25 },
    // Bottom row (facing away from monitor) - 3 chairs
    { id: "conference_chair_4", roomId: "conference", type: "chair", spriteId: "chair_office", x: 30, y: 175, width: 25, height: 25 },
    { id: "conference_chair_5", roomId: "conference", type: "chair", spriteId: "chair_office", x: 80, y: 175, width: 25, height: 25 },
    { id: "conference_chair_6", roomId: "conference", type: "chair", spriteId: "chair_office", x: 130, y: 175, width: 25, height: 25 },
    // Left side (facing right towards table) - 1 chair
    { id: "conference_chair_7", roomId: "conference", type: "chair", spriteId: "chair_office", x: 20, y: 115, width: 25, height: 25 },
    // Right side (facing left towards table) - 1 chair
    { id: "conference_chair_8", roomId: "conference", type: "chair", spriteId: "chair_office", x: 195, y: 115, width: 25, height: 25 },
    // Monitor at top (visible to all 8 agents)
    { id: "conference_screen", roomId: "conference", type: "monitor", spriteId: "monitor_wall", x: 85, y: 10, width: 70, height: 18 },
  ]
};