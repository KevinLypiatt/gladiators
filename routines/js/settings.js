// Game settings and constants
const MAZE_COLS = 8;  
const MAZE_ROWS = 8;  
const ROOM_SIZES = [
    { width: 100, height: 100 },
    { width: 150, height: 150 },
    { width: 200, height: 200 }
];
const MAX_ARROWS = 3;
const ARROW_SPEED = 4;
const PLAYER_SPEED = 2;
const WALL_THICKNESS = 1;
const SPIDER_SIGHT_RANGE = 4 * ROOM_SIZES[0].width;
const SPIDER_PATROL_RANGE = 250;
const SPIDER_DETECTION_RANGE = 250;
const SPIDER_CHASE_RANGE = 350;
const SPIDER_MAX_HEALTH = 3;
const SPIDER_HEAL_TIME = 3000;
const SPIDER_DEATH_ANIMATION_TIME = 1000;
const EFFECT_TYPES = {
    MUZZLE_FLASH: 'muzzle_flash',
    SPIDER_HIT: 'spider_hit',
    NEST_HIT: 'nest_hit',
    PLAYER_DAMAGE: 'player_damage'
};
// Add missing constant for joysticks
const TOUCH_CONTROLS = {
    JOYSTICK_SIZE: 50,
    MAX_DISTANCE: 75,
    DEADZONE: 10
};
// ...other settings if needed...
