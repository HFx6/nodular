//Export Constants
const TIME_60_HZ = 1000 / 60; //60Hz
//List of Roms Array
const ROMS = [
    '15PUZZLE',
    'BLINKY',
    'BLITZ',
    'BRIX',
    'CONNECT4',
    'GUESS',
    'HIDDEN',
    'INVADERS',
    'KALEID',
    'MAZE',
    'MERLIN',
    'MISSILE',
    'PONG',
    'PONG2',
    'PUZZLE',
    'SYZYGY',
    'TANK',
    'TETRIS',
    'TICTAC',
    'UFO',
    'VBRIX',
    'VERS',
    'WIPEOFF'
];

const SPRITE_WIDTH = 8;

const SPRITES = [
    0xF0, 0x90, 0x90, 0x90, 0xF0, // 0
    0x20, 0x60, 0x20, 0x20, 0x70, // 1
    0xF0, 0x10, 0xF0, 0x80, 0xF0, // 2
    0xF0, 0x10, 0xF0, 0x10, 0xF0, // 3
    0x90, 0x90, 0xF0, 0x10, 0x10, // 4
    0xF0, 0x80, 0xF0, 0x10, 0xF0, // 5
    0xF0, 0x80, 0xF0, 0x90, 0xF0, // 6
    0xF0, 0x10, 0x20, 0x40, 0x40, // 7
    0xF0, 0x90, 0xF0, 0x90, 0xF0, // 8
    0xF0, 0x90, 0xF0, 0x10, 0xF0, // 9
    0xF0, 0x90, 0xF0, 0x90, 0x90, // A
    0xE0, 0x90, 0xE0, 0x90, 0xE0, // B
    0xF0, 0x80, 0x80, 0x80, 0xF0, // C
    0xE0, 0x90, 0x90, 0x90, 0xE0, // D
    0xF0, 0x80, 0xF0, 0x80, 0xF0, // E
    0xF0, 0x80, 0xF0, 0x80, 0x80  // F
];

const STEP_SPEED = 10; //Execution Speed

const MEMORY_SIZE = 4095; //Max Memory Size
	const LOAD_PROGRAM_ADDRESS = 0x200; //Program Address Start Location
	const SPRITE_SET_ADDRESS = 0x000; //Sprite Load Location

//Imports from constants folder

//Export Class
class Memory {
    //Called when a new instance of the class is created
    constructor() {
        //Memory properties
        //Create a new Uint8Array called memory and set it's size to 4kb of memory
        this.memory = new Uint8Array(MEMORY_SIZE);
        //Call reset on creation
        this.reset();
    }

    //Reset Memory
    reset() {
        //Clear out the array by filling it with 0
        this.memory.fill(0);
        //Load sprites into the array at the sprite_set_address
        this.memory.set(SPRITES, SPRITE_SET_ADDRESS);
    }

    //Set Memory at location index
    setMemory(index, value) {
        //Verify memory location
        this.assertMemory(index);
        //Set location value
        this.memory[index] = value;
    }

    //Get Memory at location index
    getMemory(index) {
        //Verify memory location
        this.assertMemory(index);
        //Return memory location value
        return this.memory[index];
    }

    //Get Opcode from memory at location index
    //Opcodes are two bytes
    getOpCode(index) {
        //Get the high byte from the index
        const highByte = this.getMemory(index);
        //Get the low byte from the index + 1
        const lowByte = this.getMemory(index + 1);
        //Return the opcode
        return (highByte << 8) | lowByte;
    }

    //Verify Memory is within the bounds of the array
    assertMemory(index) {
        console.assert(index >= 0 && index < MEMORY_SIZE, `Error trying to access memory at index ${index}`);
    }
}

const NUMBER_OF_REGISTERS = 16; //Number of different registers 8 bytes each
	const STACK_DEEP = 16; //Stack Depth

//Imports

//Export Class
class Registers {
    //Called when a new instance of the class is created
    constructor() {
        //Register properties
        this.V = new Uint8Array(NUMBER_OF_REGISTERS); //16 8-bit registers
        this.I = 0; //Memory Address
        this.stack = new Uint16Array(STACK_DEEP); //Operation Stack
        this.SP = -1; //Stack pointer
        this.PC = LOAD_PROGRAM_ADDRESS; //Program Counter set to Program starting address

        this.DT = 0; //Delay Timer
        this.ST = 0; //Sound Timer

        this.paused = false; //Pause register
    }

    //Reset all variables
    reset() {
        this.V.fill(0);
        this.I = 0;
        this.stack.fill(0);
        this.SP = -1;
        this.PC = LOAD_PROGRAM_ADDRESS;

        this.DT = 0;
        this.ST = 0;

        this.paused = false;
    }

    //Push new value to stack
    stackPush(value) {
        //Increase the Stack Position
        this.SP++;
        //Assert the Stack is not Overflowing
        this.assertStackOverflow();
        //Push a value to the stack at index Stack Position
        this.stack[this.SP] = value;
    }

    //Pop a new value from the stack
    stackPop() {
        //Set value to Stack index of Stack Position
        const value = this.stack[this.SP];
        //Decrease Stack Position
        this.SP--;
        //Assert the Stack is not Underflow
        this.assertStackUnderflow();
        //Return the value
        return value;
    }

    //Assert the Stack is not Overflowing
    assertStackOverflow() {
        //Assert the Stack is less than the Stack Depth
        console.assert(this.SP < STACK_DEEP, 'Error stack Overflow');
    }

    //Assert the Stack is not Underflowed
    assertStackUnderflow() {
        //Assert the Stack Position is greater than or equal to -1
        console.assert(this.SP >= -1, 'Error stack underflow');
    }

    //Update system timers
    updateTimers() {
        if (this.DT > 0) {
            this.DT -= 1;
        }

        if (this.ST > 0) {
            this.ST -= 1;
        }
    }
}

//Export Class
//Used to log all debug features
class Debug {
    //Called when a new instance of the class is created
    constructor() {
        //Debug Properties
        this.opcodeLogs = new Array();

        this.Active = false;
    }

    //Reset function
    reset() {
        this.opcodeLogs.fill(0);
    }

    logOpcode(msg) {
        this.opcodeLogs.push(msg);
    }

    printLast() {
        console.log(this.opcodeLogs[this.opcodeLogs.length - 1]);
    }

    //Updates the Register UI
    DebugRegisters(cpu) {
        //Load Registers
        //16 bit V register
        cpu.registers.V.forEach((x, index) => {
            document.getElementById(`V${index}`).innerHTML = `0x${x.toString(16)}`;
        });
        //I register
        document.getElementById("I").innerHTML = `0x${cpu.registers.I.toString(16)}`;
        //Program Counter
        document.getElementById("PC").innerHTML = `0x${cpu.registers.PC.toString(16)}`;
        //Delay Timer
        document.getElementById("DT").innerHTML = `0x${cpu.registers.DT.toString(16)}`;
        //Sound Timer
        document.getElementById('ST').innerHTML = `0x${cpu.registers.ST.toString(16)}`;
    }

    //Updates the fpsCounter UI
    ShowFPS(fps) {
        //Get DOM element
        let counter = document.getElementById('fpsCounter');

        //Set innerHTML to fps variable
        counter.innerHTML = fps;
    }
}

//Export Constants
	const MASK_NNN = { mask: 0x0fff }; //NNN
	const MASK_N = { mask: 0x000f }; //Nibble
	const MASK_X = { mask: 0x0f00, shift: 8 }; //X
	const MASK_Y = { mask: 0x00f0, shift: 4 }; //Y
	const MASK_KK = { mask: 0x00ff }; //KK
	const MASK_HIGHEST_BYTE = 0xf000; //High byte
	const MASK_HIGHEST_AND_LOWEST_BYTE = 0xf00f; //High and Low byte
	//Instruction Set Array
	const INSTRUCTION_SET = [
	
		//Clear the display.
		{
			key: 2,
			id: 'CLS',
			name: 'CLS',
			mask: 0xffff,
			pattern: 0x00e0,
			arguments: [],
		},
	
		//Return from a subroutine
		//The interpreter sets the program counter to the address at the top of the stack, then subtracts 1 from the stack pointer.
		{
			key: 3,
			id: 'RET',
			name: 'RET',
			mask: 0xffff,
			pattern: 0x00ee,
			arguments: [],
		},
	
		//Jump to location nnn.
		//The interpreter sets the program counter to nnn.
		{
			key: 4,
			id: 'JP_ADDR',
			name: 'JP',
			mask: MASK_HIGHEST_BYTE,
			pattern: 0x1000,
			arguments: [MASK_NNN],
		},
	
		//Call subroutine at nnn.
		//The interpreter increments the stack pointer, then puts the current PC on the top of the stack. The PC is then set to nnn.
		{
			key: 5,
			id: 'CALL_ADDR',
			name: 'CALL',
			mask: MASK_HIGHEST_BYTE,
			pattern: 0x2000,
			arguments: [MASK_NNN],
		},
		
		//Skip next instruction if Vx = kk.
		//The interpreter compares register Vx to kk, and if they are equal, increments the program counter by 2.
		{
			key: 6,
			id: 'SE_VX_KK',
			name: 'SE',
			mask: MASK_HIGHEST_BYTE,
			pattern: 0x3000,
			arguments: [MASK_X, MASK_KK],
		},
	
		//Skip next instruction if Vx != kk.
		//The interpreter compares register Vx to kk, and if they are not equal, increments the program counter by 2.
		{
			key: 7,
			id: 'SNE_VX_KK',
			name: 'SNE',
			mask: MASK_HIGHEST_BYTE,
			pattern: 0x4000,
			arguments: [MASK_X, MASK_KK],
		},
	
		//Skip next instruction if Vx = Vy.
		//The interpreter compares register Vx to register Vy, and if they are equal, increments the program counter by 2.
		{
			key: 8,
			id: 'SE_VX_VY',
			name: 'SE',
			mask: MASK_HIGHEST_AND_LOWEST_BYTE,
			pattern: 0x5000,
			arguments: [MASK_X, MASK_Y],
		},
	
		//Set Vx = kk.
		//The interpreter puts the value kk into register Vx.
		{
			key: 9,
			id: 'LD_VX_KK',
			name: 'LD',
			mask: MASK_HIGHEST_BYTE,
			pattern: 0x6000,
			arguments: [MASK_X, MASK_KK],
		},
	
		//Set Vx = Vx + kk.
		//Adds the value kk to the value of register Vx, then stores the result in Vx.
		{
			key: 10,
			id: 'ADD_VX_KK',
			name: 'ADD',
			mask: MASK_HIGHEST_BYTE,
			pattern: 0x7000,
			arguments: [MASK_X, MASK_KK],
		},
	
		//Set Vx = Vy.
		//Stores the value of register Vy in register Vx.
		{
			key: 11,
			id: 'LD_VX_VY',
			name: 'LD',
			mask: MASK_HIGHEST_AND_LOWEST_BYTE,
			pattern: 0x8000,
			arguments: [MASK_X, MASK_Y],
		},
	
		//Set Vx = Vx OR Vy.
		//Performs a bitwise OR on the values of Vx and Vy, then stores the result in Vx. A bitwise OR compares 
		//the corrseponding bits from two values, and if either bit is 1, then the same bit in the result is also 1. Otherwise, it is 0.
		{
			key: 12,
			id: 'OR_VX_VY',
			name: 'OR',
			mask: MASK_HIGHEST_AND_LOWEST_BYTE,
			pattern: 0x8001,
			arguments: [MASK_X, MASK_Y],
		},
	
		//Set Vx = Vx AND Vy.
		//Performs a bitwise AND on the values of Vx and Vy, then stores the result in Vx. A bitwise AND compares the corrseponding 
		//bits from two values, and if both bits are 1, then the same bit in the result is also 1. Otherwise, it is 0.
		{
			key: 13,
			id: 'AND_VX_VY',
			name: 'AND',
			mask: MASK_HIGHEST_AND_LOWEST_BYTE,
			pattern: 0x8002,
			arguments: [MASK_X, MASK_Y],
		},
	
		//Set Vx = Vx XOR Vy.
		//Performs a bitwise exclusive OR on the values of Vx and Vy, then stores the result in Vx. An exclusive OR compares the 
		//corrseponding bits from two values, and if the bits are not both the same, then the corresponding bit in the result is set to 1. Otherwise, it is 0.
		{
			key: 14,
			id: 'XOR_VX_VY',
			name: 'XOR',
			mask: MASK_HIGHEST_AND_LOWEST_BYTE,
			pattern: 0x8003,
			arguments: [MASK_X, MASK_Y],
		},
	
		//Set Vx = Vx + Vy, set VF = carry.
		//The values of Vx and Vy are added together. If the result is greater than 8 bits (i.e., > 255,) VF is set to 1, otherwise 0.
		//Only the lowest 8 bits of the result are kept, and stored in Vx.
		{
			key: 15,
			id: 'ADD_VX_VY',
			name: 'ADD',
			mask: MASK_HIGHEST_AND_LOWEST_BYTE,
			pattern: 0x8004,
			arguments: [MASK_X, MASK_Y],
		},
	
		//Set Vx = Vx - Vy, set VF = NOT borrow.
		//If Vx > Vy, then VF is set to 1, otherwise 0. Then Vy is subtracted from Vx, and the results stored in Vx.
		{
			key: 16,
			id: 'SUB_VX_VY',
			name: 'SUB',
			mask: MASK_HIGHEST_AND_LOWEST_BYTE,
			pattern: 0x8005,
			arguments: [MASK_X, MASK_Y],
		},
	
		//Set Vx = Vx SHR 1.
		//If the least-significant bit of Vx is 1, then VF is set to 1, otherwise 0. Then Vx is divided by 2.
		{
			key: 17,
			id: 'SHR_VX_VY',
			name: 'SHR',
			mask: MASK_HIGHEST_AND_LOWEST_BYTE,
			pattern: 0x8006,
			arguments: [MASK_X, MASK_Y],
		},
	
		//Set Vx = Vy - Vx, set VF = NOT borrow.
		//If Vy > Vx, then VF is set to 1, otherwise 0. Then Vx is subtracted from Vy, and the results stored in Vx.
		{
			key: 18,
			id: 'SUBN_VX_VY',
			name: 'SUBN',
			mask: MASK_HIGHEST_AND_LOWEST_BYTE,
			pattern: 0x8007,
			arguments: [MASK_X, MASK_Y],
		},
	
		//Set Vx = Vx SHL 1.
		//If the most-significant bit of Vx is 1, then VF is set to 1, otherwise to 0. Then Vx is multiplied by 2.
		{
			key: 19,
			id: 'SHL_VX_VY',
			name: 'SHL',
			mask: MASK_HIGHEST_AND_LOWEST_BYTE,
			pattern: 0x800e,
			arguments: [MASK_X, MASK_Y],
		},
	
		//Skip next instruction if Vx != Vy.
		//The values of Vx and Vy are compared, and if they are not equal, the program counter is increased by 2.
		{
			key: 20,
			id: 'SNE_VX_VY',
			name: 'SNE',
			mask: MASK_HIGHEST_AND_LOWEST_BYTE,
			pattern: 0x9000,
			arguments: [MASK_X, MASK_Y],
		},
	
		//Set I = nnn.
		//The value of register I is set to nnn.
		{
			key: 21,
			id: 'LD_I_ADDR',
			name: 'LD',
			mask: MASK_HIGHEST_BYTE,
			pattern: 0xa000,
			arguments: [MASK_NNN],
		},
	
		//Jump to location nnn + V0.
		//The program counter is set to nnn plus the value of V0.
		{
			key: 22,
			id: 'JP_V0_ADDR',
			name: 'JP',
			mask: MASK_HIGHEST_BYTE,
			pattern: 0xb000,
			arguments: [MASK_NNN],
		},
	
		//Set Vx = random byte AND kk.
		//The interpreter generates a random number from 0 to 255, which is then ANDed with the value kk. 
		//The results are stored in Vx. See instruction 8xy2 for more information on AND.
		{
			key: 23,
			id: 'RND_VX_KK',
			name: 'RND',
			mask: MASK_HIGHEST_BYTE,
			pattern: 0xc000,
			arguments: [MASK_X, MASK_KK],
		},
	
		//Display n-byte sprite starting at memory location I at (Vx, Vy), set VF = collision.
		//The interpreter reads n bytes from memory, starting at the address stored in I. These bytes are then displayed 
		//as sprites on screen at coordinates (Vx, Vy). Sprites are XORed onto the existing screen. If this causes any pixels 
		//to be erased, VF is set to 1, otherwise it is set to 0. If the sprite is positioned so part of it is outside the coordinates 
		//of the display, it wraps around to the opposite side of the screen. See instruction 8xy3 for more information on XOR, and section 
		//2.4, Display, for more information on the Chip-8 screen and sprites.
		{
			key: 24,
			id: 'DRW_VX_VY_N',
			name: 'DRW',
			mask: MASK_HIGHEST_BYTE,
			pattern: 0xd000,
			arguments: [MASK_X, MASK_Y, MASK_N],
		},
	
		//Skip next instruction if key with the value of Vx is pressed.
		//Checks the keyboard, and if the key corresponding to the value of Vx is currently in the down position, PC is increased by 2.
		{
			key: 25,
			id: 'SKP_VX',
			name: 'SKP',
			mask: 0xf0ff,
			pattern: 0xe09e,
			arguments: [MASK_X],
		},
	
		//Skip next instruction if key with the value of Vx is not pressed.
		//Checks the keyboard, and if the key corresponding to the value of Vx is currently in the up position, PC is increased by 2.
		{
			key: 26,
			id: 'SKNP_VX',
			name: 'SKNP',
			mask: 0xf0ff,
			pattern: 0xe0a1,
			arguments: [MASK_X],
		},
	
		//Set Vx = delay timer value.
		//The value of DT is placed into Vx.
		{
			key: 27,
			id: 'LD_VX_DT',
			name: 'LD',
			mask: 0xf0ff,
			pattern: 0xf007,
			arguments: [MASK_X],
		},
	
		//Wait for a key press, store the value of the key in Vx.
		//All execution stops until a key is pressed, then the value of that key is stored in Vx.
		{
			key: 28,
			id: 'LD_VX_K',
			name: 'LD',
			mask: 0xf0ff,
			pattern: 0xf00a,
			arguments: [MASK_X],
		},
	
		//Set delay timer = Vx.
		//DT is set equal to the value of Vx.
		{
			key: 29,
			id: 'LD_DT_VX',
			name: 'LD',
			mask: 0xf0ff,
			pattern: 0xf015,
			arguments: [MASK_X],
		},
	
		//Set sound timer = Vx.
		//ST is set equal to the value of Vx.
		{
			key: 30,
			id: 'LD_ST_VX',
			name: 'LD',
			mask: 0xf0ff,
			pattern: 0xf018,
			arguments: [MASK_X],
		},
	
		//Set I = I + Vx.
		//The values of I and Vx are added, and the results are stored in I.
		{
			key: 31,
			id: 'ADD_I_VX',
			name: 'ADD',
			mask: 0xf0ff,
			pattern: 0xf01e,
			arguments: [MASK_X],
		},
	
		//Set I = location of sprite for digit Vx.
		//The value of I is set to the location for the hexadecimal sprite corresponding to the value 
		//of Vx. See section 2.4, Display, for more information on the Chip-8 hexadecimal font.
		{
			key: 32,
			id: 'LD_F_VX',
			name: 'LD',
			mask: 0xf0ff,
			pattern: 0xf029,
			arguments: [MASK_X],
		},
	
		//Store BCD representation of Vx in memory locations I, I+1, and I+2.
		//The interpreter takes the decimal value of Vx, and places the hundreds digit in memory at 
		//location in I, the tens digit at location I+1, and the ones digit at location I+2.
		{
			key: 33,
			id: 'LD_B_VX',
			name: 'LD',
			mask: 0xf0ff,
			pattern: 0xf033,
			arguments: [MASK_X],
		},
	
		//Store registers V0 through Vx in memory starting at location I.
		//The interpreter copies the values of registers V0 through Vx into memory, starting at the address in I.
		{
			key: 34,
			id: 'LD_I_VX',
			name: 'LD',
			mask: 0xf0ff,
			pattern: 0xf055,
			arguments: [MASK_X],
		},
	
		//Read registers V0 through Vx from memory starting at location I.
		//The interpreter reads values from memory starting at location I into registers V0 through Vx.
		{
			key: 35,
			id: 'LD_VX_I',
			name: 'LD',
			mask: 0xf0ff,
			pattern: 0xf065,
			arguments: [MASK_X],
		},
	
	
	
		//Chip48 Instructions
	
		{
			key: 36,
			id: 'SCD nibble',
			name: 'SCD',
			mask: MASK_N,
			pattern: 0x00C0,
			arguments: [],
		}
	];
	
	//TODO: Add Super chip8 instructions

//Imports

//Export class
class Disassembler {

  //Disassemble a given opcode
  disassemble(opcode) {
      //Constants
      //instruction set to found instruction from the InstructionSet
      const instruction = INSTRUCTION_SET.find(
          //opcode & bitwise instruction.mask === instruction.pattern
          (instruction) => (opcode & instruction.mask) === instruction.pattern
      );
      //args = instruction.argurments
      const args = instruction.arguments.map(
          //opcode & arg.mask >> arg.shift
          (arg) => (opcode & arg.mask) >> arg.shift
      );

      //Return instruction, args
      return {
          instruction,
          args
      };
  }
}

//This is the CPU which interacts with the rest of the hardware. It's main task is to performe a CPU Cycle measured in steps per cycle
//Each Cycle will run  10 steps taking in OPCodes and executing them.


class CPU {
    constructor(display, keyboard, speaker) {
        //Hardware
        this.display = display;
        this.keyboard = keyboard;
        this.speaker = speaker;

        //CPU Memory
        this.memory = new Memory();
        //CPU Registers
        this.registers = new Registers();

        //Instruction Speed
        this.speed = STEP_SPEED;
        //Handles Shift Quirk for Variations of Chip 8
        this.quirk = "Shift and Load Qurk";
        //Holds the current OpCode Instruction

        this.opcode;
        //Opcode Disassembler
        this.disassember = new Disassembler();

        this.drawFlag = false;

        this.debug = new Debug();
    }

    //Resets the CPU
    reset() {
        //Reset Memory, Registers, and Display
        this.memory.reset();
        this.registers.reset();
        this.display.reset();

        this.debug.reset();
    }

    ///Loads a selected rom into an arrayBuffer then calls loadRomIntoMemory
    async loadRom(romName) {
        //Get Rom Data
        const rom = await fetch('src/utils/test?raw-hex').then((response) => { return response.text(); });

        //Load the Rom
        //Set arrayBuffer to arraybuffer from rom
    console.log(rom);  const arrayBuffer = await new Uint8Array(rom.match(/../g).map(h=>parseInt(h,16))).buffer;
        //Set romBuffer to new Uint8Array(arrayBuffer)
        const romBuffer = new Uint8Array(arrayBuffer);

   console.log(arrayBuffer, romBuffer);     //Load rombuffer array into memory
        this.loadRomIntoMemory(romBuffer);

        //Set pause button text
        document.getElementById('pause').innerHTML = "Pause";
    }

    //Load a given romBuffer into memory
    loadRomIntoMemory(romBuffer) {
        //Reset the emulator
        this.reset(); //Reset Registers, Memory, and Display

        //Check romBuffer Length + Loader address is less than memory size
        console.assert(romBuffer.length + LOAD_PROGRAM_ADDRESS <= MEMORY_SIZE, "Error rom is too large");

        //Insert rom into memory at location 0x200 which is the address where programs start in chip8
        this.memory.memory.set(romBuffer, LOAD_PROGRAM_ADDRESS);
    }

    //CPU Cycle
    //One CPU Cycle
    cycle() {
        //Since this will execute a batch of instructions based on speed will need to have the pause check inside
        for (let i = 0; i < this.speed; i++) {
            //Check if paused
            //Used for programs that check for pause and await input like connect4 and tictac
            if (!this.registers.paused) {
                //Execute an instruction step
                this.step();
            }
        }

        //Check if paused
        if (!this.registers.paused) {
            //Update system timers
            this.registers.updateTimers();
        }

        //Call play sound
        this.speaker.playSound(this.registers.ST);

        //Render only if flag is true
        if (this.drawFlag) {
            //Render display
            this.display.render();
            //Set draw flag to false
            this.drawFlag = false;
        }
    }

    //Step executes a cpu instruction and logs registers and instructions
    //One Chip8 Instruction
    step() {
        //Get opcode from memory. Opcode is two bytes
        this.opcode = this.memory.getOpCode(this.registers.PC); //Error is here

        //Check that the opcode is not 0
        if (this.opcode !== 0) {
            //Execute instruction sending opcode
            this.executeInstruction(this.opcode);

            //If debug mode is active
            if (this.debug.Active) {
                // show registers
                this.debug.DebugRegisters(this);
            }
        }
    }

    //Using Disassembler
    executeInstruction(opcode) {
        //Increment the program counter for next instruction
        //Each instruction is 2 bytes to increment by 2
        this.registers.PC += 2;

        //Test Disassembler Debug
        const {
            instruction,
            args
        } = this.disassember.disassemble(opcode);
        const {
            id
        } = instruction;

        //To hex or not to hex?
        this.debug.logOpcode(`${instruction.id}: 0x${opcode.toString(16)}`);

        //Details on each instruction can be found inside the Constants/InstructinoSet.js file
        //This includes name, mask, pattern, and arguments
        switch (id) {
            //Chip8 Instructions
            //00E0
            case 'CLS':
                this.display.reset();
                break;
                //00EE
            case 'RET':
                this.registers.PC = this.registers.stackPop();
                break;
                //1NNN
            case 'JP_ADDR':
                this.registers.PC = args[0];
                break;
                //2NNN
            case 'CALL_ADDR':
                this.registers.stackPush(this.registers.PC);
                this.registers.PC = args[0];
                break;
                //3XKK
            case 'SE_VX_KK':
                if (this.registers.V[args[0]] === args[1]) {
                    this.registers.PC += 2;
                }
                break;
                //4XKK
            case 'SNE_VX_KK':
                if (this.registers.V[args[0]] !== args[1]) {
                    this.registers.PC += 2;
                }
                break;
                //5XY0
            case 'SE_VX_VY':
                if (this.registers.V[args[0]] === this.registers.V[args[1]]) {
                    this.registers.PC += 2;
                }
                break;
                //6XKK
            case 'LD_VX_KK':
                this.registers.V[args[0]] = args[1];
                break;
                //7XKK
            case 'ADD_VX_KK':
                this.registers.V[args[0]] += args[1];
                break;
                //8XY0
            case 'LD_VX_VY':
                this.registers.V[args[0]] = this.registers.V[args[1]];
                break;
                //8XY1
            case 'OR_VX_VY':
                this.registers.V[args[0]] |= this.registers.V[args[1]];
                break;
                //8XY2
            case 'AND_VX_VY':
                this.registers.V[args[0]] &= this.registers.V[args[1]];
                break;
                ////8XY3
            case 'XOR_VX_VY':
                this.registers.V[args[0]] ^= this.registers.V[args[1]];
                break;
                //8XY4
            case 'ADD_VX_VY':
                let sum = (this.registers.V[args[0]] += this.registers.V[args[1]]);

                this.registers.V[0xF] = 0;

                if (sum > 0xFF) {
                    this.registers.V[0xF] = 1;
                }

                this.registers.V[args[0]] = sum;
                break;
                //8XY5
            case 'SUB_VX_VY':
                this.registers.V[0xF] = 0;

                if (this.registers.V[args[0]] > this.registers.V[args[1]]) {
                    this.registers.V[0xF] = 1;
                }

                this.registers.V[args[0]] -= this.registers.V[args[1]];
                break;
                //8XY6
            case 'SHR_VX_VY':
                //Set Vf to result of (Vx & 0x1)
                this.registers.V[0xF] = (this.registers.V[args[0]] & 0x1);

                //Quirk Behavior
                if (this.quirk === "No Quirk") {
                    //Original CHIP 8
                    //Set Vx = Vy shifted to the right 1 bit
                    this.registers.V[args[0]] = this.registers.V[args[1]] >>= 1;
                } else {
                    //Default
                    //CHIP48 and SCHIP behavior
                    //Shift Vx to the right 1 bit
                    this.registers.V[args[0]] >>= 1;
                }
                break;
                //8XY7
            case 'SUBN_VX_VY':
                this.registers.V[0xF] = 0;

                if (this.registers.V[args[1]] > this.registers.V[args[0]]) {
                    this.registers.V[0xF] = 1;
                }

                this.registers.V[args[0]] = this.registers.V[args[1]] - this.registers.V[args[0]];

                break;
                //8XYE
            case 'SHL_VX_VY':
                this.registers.V[0xF] = (this.registers.V[args[0]] & 0x80);
                this.registers.V[args[0]] <<= 1;
                break;
                //9XY0
            case 'SNE_VX_VY':
                if (this.registers.V[args[0]] !== this.registers.V[args[1]]) {
                    this.registers.PC += 2;
                }
                break;
                //ANNN
            case 'LD_I_ADDR':
                this.registers.I = args[0];
                break;
                //BNNN
            case 'JP_V0_ADDR':
                this.registers.PC = (args[0]) + this.registers.V[0];
                break;
                //CXKK
            case 'RND_VX_KK':
                let rand = Math.floor(Math.random() * 0xFF);

                this.registers.V[args[0]] = rand & (opcode & 0xFF);
                break;
                //DXYN
            case 'DRW_VX_VY_N':
                let width = SPRITE_WIDTH;
                let height = (opcode & 0xF);

                this.registers.V[0xF] = 0;

                for (let row = 0; row < height; row++) {
                    let sprite = this.memory.memory[this.registers.I + row];

                    for (let col = 0; col < width; col++) {
                        if ((sprite & 0x80) > 0) {
                            //If setPixel returns 1, a pixel was erased and set VF to 1
                            if (this.display.setPixel(this.registers.V[args[0]] + col, this.registers.V[args[1]] + row)) {
                                this.registers.V[0xF] = 1;
                            }
                        }
                        //Shift the sprite left 1, this will move to the next col/bit
                        //Ex. 10010000 << 1 will become 0010000
                        sprite <<= 1;
                    }
                }

                this.drawFlag = true;
                break;
                //EX9E
            case 'SKP_VX':
                if (this.keyboard.isKeyPressed(this.registers.V[args[0]])) {
                    this.registers.PC += 2;
                }
                break;
                //EXA1
            case 'SKNP_VX':
                if (!this.keyboard.isKeyPressed(this.registers.V[args[0]])) {
                    this.registers.PC += 2;
                }
                break;
                //FX07
            case 'LD_VX_DT':
                this.registers.V[args[0]] = this.registers.DT;
                break;
                //FX0A
                //Used in Connect4 and TicTac
            case 'LD_VX_K':
                this.registers.paused = true;

                this.keyboard.onNextKeyPress = function(key) {
                    this.registers.V[args[0]] = key;
                    this.registers.paused = false;
                }.bind(this);
                break;
                //FX15
            case 'LD_DT_VX':
                this.registers.DT = this.registers.V[args[0]];
                break;
                //FX18
            case 'LD_ST_VX':
                this.registers.ST = this.registers.V[args[0]];
                break;
                //FX1E
            case 'ADD_I_VX':
                this.registers.I += this.registers.V[args[0]];
                break;
                //FX29
            case 'LD_F_VX':
                this.registers.I = this.registers.V[args[0]] * 5;
                break;
                //FX33
            case 'LD_B_VX':
                //Get Hundreds place
                this.memory.memory[this.registers.I] = parseInt(this.registers.V[args[0]] / 100);
                //Get Tens place
                this.memory.memory[this.registers.I + 1] = parseInt((this.registers.V[args[0]] % 100) / 10);
                //Get Ones place
                this.memory.memory[this.registers.I + 2] = parseInt(this.registers.V[args[0]] % 10);
                break;
                //FX55
            case 'LD_I_VX':
                for (let registerIndex = 0; registerIndex <= args[0]; registerIndex++) {
                    this.memory.memory[this.registers.I + registerIndex] = this.registers.V[registerIndex];
                }

                //Check for quirk
                if (this.quirk === "No Quirk") {
                    this.registers.I += args[0] + 1;
                } else if (this.quirk === "Shift and Load Quirk") {
                    this.registers.I += args[0];
                }
                break;
                //FX65
            case 'LD_VX_I':
                for (let registerIndex = 0; registerIndex <= args[0]; registerIndex++) {
                    this.registers.V[registerIndex] = this.memory.memory[this.registers.I + registerIndex];
                }

                //Check for quirk
                if (this.quirk === "No Quirk") {
                    this.registers.I += args[0] + 1;
                } else if (this.quirk === "Shift and Load Qurk") {
                    this.registers.I += args[0];
                }
                break;


            default:
                console.error(`Instruction with id ${id} not found`, instruction, args);
        }
    }
}

//Export Constants
const DISPLAY_WIDTH = 64; //Width
const DISPLAY_HEIGHT = 32; //Height
//export const SPRITE_HIGHT = 5;
const SCALE = 10;
const BG_COLOR = "#282828"; //Background
const COLOR = "#FFB000"; //Foreground

class Display {
    constructor() {
        //Display properties
        this.scale = SCALE; //Screen Scale
       console.log(`this is the bg color${BG_COLOR}`); this.bgColor = BG_COLOR; //Background Color
        this.color = COLOR; //Fore Color

        //Get Screen and Context
        this.screen = document.querySelector('canvas'); //Screen
        this.context = this.screen.getContext('2d'); //2D Context

        //Create a frameBuffer to hold all of the pixels
        this.frameBuffer = new Array(DISPLAY_WIDTH * DISPLAY_HEIGHT); //Frame Buffer array

        //Call Reset
        this.reset();
    }

    //Reset the display
    reset() {
        //Clear the array of pixels by filling with 0s
        this.frameBuffer.fill(0);
        //Set the fill style to background color
        this.context.fillStyle = this.bgColor;
        //Fill the screen
        this.context.fillRect(0, 0, this.screen.width, this.screen.height);

        //Render display
        this.render();
    }

    //Scales the screen by multiplying the scale against the default height and width
    scaleScreen() {
        //Set screen width and height and scale it
        this.screen.width = DISPLAY_WIDTH * this.scale;
        this.screen.height = DISPLAY_HEIGHT * this.scale;
    }

    //Sets a pixel to 1 or 0 inside the frameBuffer by XOR pixels
    setPixel(x, y) {
        //Constant Pixel X and Pixel Y location
        //Calculate using modulo to handle screen wrap
        const px = x % DISPLAY_WIDTH;
        const py = y % DISPLAY_HEIGHT;

        //Set pixelLocation to px + (py * width of the display constant)
        let pixelLoc = px + (py * DISPLAY_WIDTH);

        //Set pixel inside frameBuffer[pixelLoc as index] to XOR bitwise operation 0 or 1
        this.frameBuffer[pixelLoc] ^= 1;

        //Opposite Return if pixel was erased. 1 true for erased, 0 false for nothing erased
        return !this.frameBuffer[pixelLoc];
    }

    render() {
        //Scale the screen first
        this.scaleScreen();

        //Clear the canvas
        this.context.clearRect(0, 0, this.screen.width, this.screen.height);
        //Set background color
        this.context.fillStyle = this.bgColor;
        //Fill the canvas
        this.context.fillRect(0, 0, this.screen.width, this.screen.height);

        //Loop through the display width * height
        for (let i = 0; i < DISPLAY_WIDTH * DISPLAY_HEIGHT; i++) {
            //Get x location (i mod width) * scale
            let x = (i % DISPLAY_WIDTH) * this.scale;

            //Get y = Math.floor(i divide width) * scale
            let y = Math.floor(i / DISPLAY_WIDTH) * this.scale;

            //Check the frame buffer at location i for 0 or 1
            if (this.frameBuffer[i]) {
                //Set the fillstyle to color
                this.context.fillStyle = this.color;

                //Fill a new rectangle at location x,y setting its size to scale variable
                this.context.fillRect(x, y, this.scale, this.scale);
            }
        }
    }

}

//Export Constants
	const NUMBER_OF_KEYS = 16; //Number of keys in the keypad
	
	//Keymap of the keyboard
	const KEYMAP = {
			49: 0x1, // 1
			50: 0x2, // 2
			51: 0x3, // 3
			52: 0xc, // 4
			81: 0x4, // Q
			87: 0x5, // W
			69: 0x6, // E
			82: 0xD, // R
			65: 0x7, // A
			83: 0x8, // S
			68: 0x9, // D
			70: 0xE, // F
			90: 0xA, // Z
			88: 0x0, // X
			67: 0xB, // C
			86: 0xF  // V
	};

//Imports

//Export Class
class Keyboard {
    //Called when a new instance of the class is created
    constructor() {
        //Keyboard properties
        //Keymap set to constant KEYMAP
        this.KEYMAP = KEYMAP;
        //keyPressed Array to size of keyboard fill with false
        this.keyPressed = new Array(NUMBER_OF_KEYS).fill(false);

        //onNextKeyPress to hold 
        this.onNextKeyPress = null;

        //Add keydown and keyup event listeners to the window
        window.addEventListener('keydown', this.onKeyDown.bind(this), false);
        window.addEventListener('keyup', this.onKeyUp.bind(this), false);
    }

    //check if the provided keycode is pressed(true) in the array
    isKeyPressed(keyCode) {
        //Return value from keyPressed array using the provided value as an index     
        return this.keyPressed[keyCode];
    }

    //onKeyDown Event for the window
    onKeyDown(event) {
        //Get key from keymap
        let key = this.KEYMAP[event.which];

        //Check that the key exists in the keymap
        if (key != undefined) {
            //Set keypressed at index key to true
            this.keyPressed[key] = true;

            // Make sure onNextKeyPress is initialized and the pressed key is actually mapped to a Chip-8 key
            if (this.onNextKeyPress !== null && key) {
                //parseInt the key pressed for onNextKeyPress
                this.onNextKeyPress(parseInt(key));
                //Set onNextKeyPress to null
                this.onNextKeyPress = null;
            }
        }
    }

    //onKeyUp Event for the window
    onKeyUp(event) {
        //Get key from keymap
        let key = this.KEYMAP[event.which];

        //Check that the key exists in the keymap
        if (!key != undefined) {
            //Set keypressed at index key to true
            this.keyPressed[key] = false;
        }
    }
}

class Settings {
    constructor() {

    }

    save(name, value) {
        // Check browser support
        if (typeof(Storage) !== "undefined") {
            // Store
            localStorage.setItem(name, value);
            console.log(`${name} ${value}`);

        } else {
            alert("Sorry, your browser does not support Web Storage...");
        }
    }

    load(cpu) {
        // Check browser support
        if (typeof(Storage) !== "undefined") {
            //Load
            if (localStorage.length > 0) {
                //CPU 
                cpu.speed = localStorage.getItem("speed");
                cpu.quirk = localStorage.getItem("quirk");

                // //Display
                cpu.display.scale = localStorage.getItem("scale");

                cpu.display.bgColor = localStorage.getItem("bgColor");
                cpu.display.color = localStorage.getItem("color");

                // // //Sound
                cpu.speaker.volumeLevel = localStorage.getItem("volume");
                cpu.speaker.wave = localStorage.getItem("wave");

                //cpu.speaker.isMute = localStorage.getItem("mute");
            }


        } else {
            alert("Sorry, your browser does not support Web Storage...");
        }
    }
}

//#region Page Controls
//CPU
const speedStepText = document.getElementById('speedStep'); //Changable
const stepCPU = document.getElementById('step');
const pauseBtn = document.getElementById('pause');
const quirk = document.getElementById('quirkType'); //Changable

//Display
const displayScale = document.getElementById('displayScale'); //Changable

//const fpsScale = document.getElementById('fps'); //TODO: may move to cpu

const bgColorInput = document.getElementById('bgColor'); //Changable
const colorInput = document.getElementById('color'); //Changable

const fps = document.getElementById('fpsControl');
const showfps = document.getElementById('showfps');

//Sound
const volumeControl = document.getElementById('volumeControl'); //Changable
const volumeLevel = document.getElementById('volumeNumber');
const oscillatorType = document.getElementById('oscillator'); //Changable
const muteControl = document.getElementById('sound'); //Changable

//ROMS
const romSelect = document.getElementById('roms');
const loadBtn = document.getElementById('load');

//Debug
const debugChk = document.getElementById('debug');

const settings = new Settings(); //Create new instance of settings
//#endregion

//Variable to hold the CPU instance
var processor;

class Controls {
    constructor(cpu) {
        //CPU Instance
        processor = cpu;

        //#region Controls Event Listeners
        //CPU
        pauseBtn.addEventListener('click', this.pause);
        stepCPU.addEventListener('click', this.stepNext);
        speedStepText.addEventListener('input', this.ChangeSpeed);
        quirk.addEventListener('click', this.setQuirk);

        //Display
        displayScale.addEventListener('input', this.ChangeScale);
        bgColorInput.addEventListener('change', this.changeBGColor);
        colorInput.addEventListener('change', this.changeColor);
        showfps.addEventListener('click', this.ShowFpsCounter);

        //Sound
        volumeControl.addEventListener('change', this.changeVolume);
        volumeControl.addEventListener('input', this.sliderChange);

        oscillatorType.addEventListener('click', this.changeOscillator);
        muteControl.addEventListener('click', this.MuteAudio);

        //ROMS
        loadBtn.addEventListener('click', this.loadSelectedRom);

        //Debug
        debugChk.addEventListener('click', this.showDebugOptions);

        //Window

        //#endregion

        this.loadControls();
    }

    //Loads the controls with values from the emulator
    loadControls() {
        settings.load(processor); //Load Local Storage int CPU

        //#region Controls Values Load
        //CPU
        speedStepText.value = processor.speed;
        quirk.value = processor.quirk;

        //Display
        displayScale.value = processor.display.scale;

        bgColorInput.value = '#000000';
        colorInput.value = '#FFFFFF';

        //Sound
        volumeControl.value = processor.speaker.volumeLevel;
        volumeLevel.innerHTML = processor.speaker.volumeLevel;

        oscillatorType.value = processor.speaker.wave;

        //#endregion

        //ROMS
        this.loadRomNames(); //Loads the roms from the roms folder
    }



    //////////////////////////Methods to handle the controls///////////////////////////////////////

    //#region Controls Functions
    //#region CPU
    //Pause the CPU
    pause() {
        //Check if CPU is already paused
        if (processor.registers.paused) {
            //Set register to false and change control text to Pause
            processor.registers.paused = false;
            pauseBtn.innerHTML = "Pause";
        } else {
            //Set register to true and change control text to Play
            processor.registers.paused = true;
            pauseBtn.innerHTML = "Play";
        }
    }

    //Step the CPU by one instruction
    stepNext() {
        //call CPU step method
        processor.step();
        //Render the display
        processor.display.render();
    }

    //Change cpu speed
    //This changes how many instructions per CPU cycle
    ChangeSpeed() {
        processor.speed = speedStepText.value;

        settings.save("speed", speedStepText.value); //Save value
    }

    //Turns on or off cpu quirk which handles different types of chip8 cpus
    setQuirk() {
        processor.quirk = quirk.value;

        settings.save("quirk", quirk.value); //Save value
    }
    //#endregion

    //#region  Display
    //Change the scale of the display on the page
    ChangeScale() {
        processor.display.scale = displayScale.value;

        processor.display.render();

        settings.save("scale", displayScale.value);
    }

    //Changes the background color of the display
    changeBGColor() {
      console.log(processor.display.bgColor, bgColorInput.value);  processor.display.bgColor = bgColorInput.value;
     console.log(processor.display.bgColor, bgColorInput.value);   processor.display.render();

        settings.save("bgColor", bgColorInput.value);
    }

    //Changes the foreground color of the display
    changeColor() {
        processor.display.color = colorInput.value;
        processor.display.render();

        settings.save("color", colorInput.value);
    }

    ShowFpsCounter() {
        if (showfps.checked) {
            fps.style.display = "block";
        } else {
            fps.style.display = "none";
        }
    }
    //#endregion

    //#region Sound
    //Changes the volume of the speaker
    changeVolume() {
        //Set the volumeLevel to the Control value
        processor.speaker.volumeLevel = volumeControl.value;
        settings.save("volume", volumeControl.value);
    }
    //Shows the volume level to user
    sliderChange() {
        volumeLevel.innerHTML = volumeControl.value;
    }


    //Changes the Oscillator type in the speaker
    changeOscillator() {
        //Set the wave to the Control value
        processor.speaker.wave = oscillatorType.value;

        settings.save("wave", oscillatorType.value);
    }

    //Mutes the speaker
    MuteAudio() {
        //Check if the control is checked
        if (muteControl.checked) {
            //Mute the speaker. This will set it's volume to 0
            processor.speaker.mute();
            //settings.save("mute", true);
        } else {
            //unmute the speaker giving it the volume control value
            processor.speaker.unMute(volumeControl.value);
            //settings.save("mute", false);
        }
    }
    //#endregion

    //#region ROMS
    //Loads a preset list of rom names from the EmulatorConstants file and adds them to the control
    loadRomNames(cpu) {
        //Map to the ROMS array
        ROMS.map(rom => {
            //Create a new option element
            var option = document.createElement("option");
            //Fill details
            option.value = rom;
            option.text = rom;
            //Append to the romSelect control
            romSelect.appendChild(option);
        });

        //Call the loadSelectedRom method
        this.loadSelectedRom();
    }

    //Loads a selected rom into the program
    //ToDo: Change to take in a value so that user can load their own roms
    async loadSelectedRom() {
        //console.log(romSelect.value);

        //Call the loadRom method from the CPU
        await processor.loadRom(romSelect.value);
        //Set the pauseBtn control text to read Pause as loading will unpause the CPU
        //this.pauseBtn.innerHTML = "Pause";
    }
    //#endregion

    //#region Debug
    showDebugOptions() {
        let debugPanel = document.getElementById('debugPanel');

        if (debugChk.checked) {
            debugPanel.style.display = "block";
            processor.debug.Active = true;
        } else {
            debugPanel.style.display = "none";
        }
    }
    //#endregion

    //#endregion
}

//Class to be exported to other classes
class Speaker {
    //Called when creating an instance of the class
    constructor() {
        //Speaker properties
        this.isMute = false;
        this.soundEnabled = false; //Holds whether the sound is enabled or not. Object defined in speaker init function
        this.volumeLevel = 0.3; //Holds the volume level of the speaker
        this.wave = "square"; //Holds the wave of the oscillator

        //Initialize speaker
        speakerInit(this);
    }

    //Funtions
    //Enables the sound Card
    enableSound() {
        this.soundEnabled = true;
    }

    //Disables the sound Card
    disableSound() {
        this.soundEnabled = false;
    }

    //User Controlled
    mute() {
        //Set audio level to 0
        this.volumeLevel = 0.0;
    }

    unMute(value) {
        //Set audio level to incoming value
        //This will help when volume has been changed while the speaker is muted
        this.volumeLevel = value;
    }

    //Play Sound based on sound timer value
    playSound(st) {
        if (st > 0) {
            //Play
            this.enableSound();
        } else {
            //Stop
            this.disableSound();
        }
    }
}

//Initialization function
//This creates the property soundEnabled for the speaker as well as creating the gain and audio context. It does not need to be exported.
function speakerInit(speaker) {
    //Check if browser supports audio context
    if ("AudioContext" in window || "webkitAudioContext" in window) {
        //Create audioContext and masterGain
        const audioContext = new(AudioContext || webkitAudioContext)(); //Create an audio Context
        const masterGain = new GainNode(audioContext); //Create a masterGain GainNode

        //connect the masterGain to the audio context
        masterGain.connect(audioContext.destination);

        //Create variables soundEnabled and Oscillator
        let soundEnabled = false;
        let oscillator;

        //Create an object and define its properties to speaker
        Object.defineProperties(speaker, {
            //Sound Enabled Property
            soundEnabled: {
                //Getter
                get: function() {
                    return soundEnabled;
                },
                //Setter
                set: function(value) {
                    //if incomming value already is equal to soundEnabled exit function
                    if (value === soundEnabled) {
                        return
                    }

                    //Set soundEnabled to incoming value
                    soundEnabled = value;

                    //Check soundEnabled true
                    if (soundEnabled) {
                        //Set masterGain gain value here so volume control works
                        masterGain.gain.value = speaker.volumeLevel;
                        //Start Oscillator giving it the audiocontext and the wave
                        oscillator = new OscillatorNode(audioContext, {
                            type: speaker.wave
                        });
                        //Connect the oscillator to the mastergain
                        oscillator.connect(masterGain);
                        //Start the oscillator
                        oscillator.start();
                    } else {
                        //Stop the Oscillator
                        oscillator.stop();
                    }
                }
            }
        });
    }
}

//This is the Emulator Class which will initialize the hardware and also any and all DOM Debug features on the html page

//#region Initialize
//Create new instances of the hardware
const display = new Display();
const keyboard = new Keyboard();
const speaker = new Speaker();

//Attatch the hardware to a new instance of the CPU
const cpu = new CPU(display, keyboard, speaker);
//#endregion

//Loads the pages controls and handles their events
new Controls(cpu);


//Variables for calculating FPS
var now, then, delta;

function init() {
    //#region Start Emulator
    //Get Start
    then = Date.now();

    //Call the loop
    //Infinite Function
    emuCycle();
    //#endregion
}

//#region EmuCycle
//This should run at 60Hz but can be changed by fps counter
function emuCycle() {
    var timePassed = (Date.now() - now) / 1000;
    //Framerate Calculations
    now = Date.now();
    delta = now - then;
    var fps = Math.round(1 / timePassed);

    //This will force 60Hz
    if (delta > TIME_60_HZ) {
        //Contextual Comments from https://gist.github.com/elundmark
        // update time stuffs
        // Just `then = now` is not enough.
        // Lets say we set fps at 10 which means
        // each frame must take 100ms
        // Now frame executes in 16ms (60fps) so
        // the loop iterates 7 times (16*7 = 112ms) until
        // delta > interval === true
        // Eventually this lowers down the FPS as
        // 112*10 = 1120ms (NOT 1000ms).
        // So we have to get rid of that extra 12ms
        // by subtracting delta (112) % interval (100).
        // Hope that makes sense.
        then = now - (delta % TIME_60_HZ);

        //Call the cpu cycle method
        //each cycle is 10 steps
        cpu.cycle();
        if (!cpu.registers.paused) {
            cpu.debug.ShowFPS(fps);
        }
    }

    //Recursion
    requestAnimationFrame(emuCycle);
}

//#endregion

//Call Initialization Function
init();
