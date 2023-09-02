//This is the CPU which interacts with the rest of the hardware. It's main task is to performe a CPU Cycle measured in steps per cycle
//Each Cycle will run  10 steps taking in OPCodes and executing them.
import { SPRITE_WIDTH } from "CharSet.js";
import { STEP_SPEED } from "CPUConstants.js";
import { LOAD_PROGRAM_ADDRESS, MEMORY_SIZE } from "MemoryConstants.js";
import { Memory } from "memory.js"
import { Registers } from "registers.js";
import { Debug } from "debug.js";
import { Disassembler } from 'disassembler.js';


export class CPU {
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

        this.opcode
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
        const rom = await fetch("./src/utils/test");
        
        const arrayBuffer3 = await new Uint8Array(rom.match(/../g).map(h=>parseInt(h,16))).buffer
        console.log(arrayBuffer3);

        //Load the Rom
        //Set arrayBuffer to arraybuffer from rom
        // const arrayBuffer = await rom.arrayBuffer();
        //Set romBuffer to new Uint8Array(arrayBuffer)
        const romBuffer = new Uint8Array(arrayBuffer3);

        //Load rombuffer array into memory
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
        this.debug.logOpcode(`${instruction.id}: 0x${opcode.toString(16)}`)

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