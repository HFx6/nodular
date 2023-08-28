{
    "nodes": [
        {
            "width": 176,
            "height": 112,
            "id": "nodular_1693117134023",
            "type": "javascriptNode",
            "position": {
                "x": -45.08449964736428,
                "y": -432.039633554186
            },
            "data": {
                "label": "isinarray",
                "lang": "node",
                "loading": false,
                "func": "import { ROMS } from \"./Constants/EmulatorConstants.js\";\nimport { Settings } from \"./settings.js\";\n\n//#region Page Controls\n//CPU\nconst speedStepText = document.getElementById('speedStep'); //Changable\nconst stepCPU = document.getElementById('step');\nconst pauseBtn = document.getElementById('pause');\nconst quirk = document.getElementById('quirkType'); //Changable\n\n//Display\nconst displayScale = document.getElementById('displayScale'); //Changable\n\n//const fpsScale = document.getElementById('fps'); //TODO: may move to cpu\n\nconst bgColorInput = document.getElementById('bgColor'); //Changable\nconst colorInput = document.getElementById('color'); //Changable\n\nconst fps = document.getElementById('fpsControl');\nconst showfps = document.getElementById('showfps');\n\n//Sound\nconst volumeControl = document.getElementById('volumeControl'); //Changable\nconst volumeLevel = document.getElementById('volumeNumber');\nconst oscillatorType = document.getElementById('oscillator'); //Changable\nconst muteControl = document.getElementById('sound'); //Changable\n\n//ROMS\nconst romSelect = document.getElementById('roms');\nconst loadBtn = document.getElementById('load');\n\n//Debug\nconst debugChk = document.getElementById('debug');\n\nconst settings = new Settings(); //Create new instance of settings\n//#endregion\n\n//Variable to hold the CPU instance\nvar processor;\n\nexport class Controls {\n    constructor(cpu) {\n        //CPU Instance\n        processor = cpu;\n\n        //#region Controls Event Listeners\n        //CPU\n        pauseBtn.addEventListener('click', this.pause);\n        stepCPU.addEventListener('click', this.stepNext);\n        speedStepText.addEventListener('input', this.ChangeSpeed);\n        quirk.addEventListener('click', this.setQuirk)\n\n        //Display\n        displayScale.addEventListener('input', this.ChangeScale);\n        bgColorInput.addEventListener('change', this.changeBGColor);\n        colorInput.addEventListener('change', this.changeColor);\n        showfps.addEventListener('click', this.ShowFpsCounter);\n\n        //Sound\n        volumeControl.addEventListener('change', this.changeVolume);\n        volumeControl.addEventListener('input', this.sliderChange)\n\n        oscillatorType.addEventListener('click', this.changeOscillator);\n        muteControl.addEventListener('click', this.MuteAudio);\n\n        //ROMS\n        loadBtn.addEventListener('click', this.loadSelectedRom);\n\n        //Debug\n        debugChk.addEventListener('click', this.showDebugOptions)\n\n        //Window\n\n        //#endregion\n\n        this.loadControls();\n    }\n\n    //Loads the controls with values from the emulator\n    loadControls() {\n        settings.load(processor); //Load Local Storage int CPU\n\n        //#region Controls Values Load\n        //CPU\n        speedStepText.value = processor.speed;\n        quirk.value = processor.quirk;\n\n        //Display\n        displayScale.value = processor.display.scale;\n\n        bgColorInput.value = processor.display.bgColor;\n        colorInput.value = processor.display.color;\n\n        //Sound\n        volumeControl.value = processor.speaker.volumeLevel;\n        volumeLevel.innerHTML = processor.speaker.volumeLevel;\n\n        oscillatorType.value = processor.speaker.wave;\n\n        //#endregion\n\n        //ROMS\n        this.loadRomNames(); //Loads the roms from the roms folder\n    }\n\n\n\n    //////////////////////////Methods to handle the controls///////////////////////////////////////\n\n    //#region Controls Functions\n    //#region CPU\n    //Pause the CPU\n    pause() {\n        //Check if CPU is already paused\n        if (processor.registers.paused) {\n            //Set register to false and change control text to Pause\n            processor.registers.paused = false;\n            pauseBtn.innerHTML = \"Pause\";\n        } else {\n            //Set register to true and change control text to Play\n            processor.registers.paused = true;\n            pauseBtn.innerHTML = \"Play\";\n        }\n    }\n\n    //Step the CPU by one instruction\n    stepNext() {\n        //call CPU step method\n        processor.step();\n        //Render the display\n        processor.display.render();\n    }\n\n    //Change cpu speed\n    //This changes how many instructions per CPU cycle\n    ChangeSpeed() {\n        processor.speed = speedStepText.value;\n\n        settings.save(\"speed\", speedStepText.value); //Save value\n    }\n\n    //Turns on or off cpu quirk which handles different types of chip8 cpus\n    setQuirk() {\n        processor.quirk = quirk.value;\n\n        settings.save(\"quirk\", quirk.value); //Save value\n    }\n    //#endregion\n\n    //#region  Display\n    //Change the scale of the display on the page\n    ChangeScale() {\n        processor.display.scale = displayScale.value;\n\n        processor.display.render();\n\n        settings.save(\"scale\", displayScale.value);\n    }\n\n    //Changes the background color of the display\n    changeBGColor() {\n        processor.display.bgColor = bgColorInput.value;\n        processor.display.render();\n\n        settings.save(\"bgColor\", bgColorInput.value);\n    }\n\n    //Changes the foreground color of the display\n    changeColor() {\n        processor.display.color = colorInput.value;\n        processor.display.render();\n\n        settings.save(\"color\", colorInput.value);\n    }\n\n    ShowFpsCounter() {\n        if (showfps.checked) {\n            fps.style.display = \"block\";\n        } else {\n            fps.style.display = \"none\";\n        }\n    }\n    //#endregion\n\n    //#region Sound\n    //Changes the volume of the speaker\n    changeVolume() {\n        //Set the volumeLevel to the Control value\n        processor.speaker.volumeLevel = volumeControl.value;\n        settings.save(\"volume\", volumeControl.value);\n    }\n    //Shows the volume level to user\n    sliderChange() {\n        volumeLevel.innerHTML = volumeControl.value;\n    }\n\n\n    //Changes the Oscillator type in the speaker\n    changeOscillator() {\n        //Set the wave to the Control value\n        processor.speaker.wave = oscillatorType.value;\n\n        settings.save(\"wave\", oscillatorType.value);\n    }\n\n    //Mutes the speaker\n    MuteAudio() {\n        //Check if the control is checked\n        if (muteControl.checked) {\n            //Mute the speaker. This will set it's volume to 0\n            processor.speaker.mute();\n            //settings.save(\"mute\", true);\n        } else {\n            //unmute the speaker giving it the volume control value\n            processor.speaker.unMute(volumeControl.value);\n            //settings.save(\"mute\", false);\n        }\n    }\n    //#endregion\n\n    //#region ROMS\n    //Loads a preset list of rom names from the EmulatorConstants file and adds them to the control\n    loadRomNames(cpu) {\n        //Map to the ROMS array\n        ROMS.map(rom => {\n            //Create a new option element\n            var option = document.createElement(\"option\");\n            //Fill details\n            option.value = rom;\n            option.text = rom;\n            //Append to the romSelect control\n            romSelect.appendChild(option);\n        });\n\n        //Call the loadSelectedRom method\n        this.loadSelectedRom();\n    }\n\n    //Loads a selected rom into the program\n    //ToDo: Change to take in a value so that user can load their own roms\n    async loadSelectedRom() {\n        //console.log(romSelect.value);\n\n        //Call the loadRom method from the CPU\n        await processor.loadRom(romSelect.value);\n        //Set the pauseBtn control text to read Pause as loading will unpause the CPU\n        //this.pauseBtn.innerHTML = \"Pause\";\n    }\n    //#endregion\n\n    //#region Debug\n    showDebugOptions() {\n        let debugPanel = document.getElementById('debugPanel');\n\n        if (debugChk.checked) {\n            debugPanel.style.display = \"block\"\n            processor.debug.Active = true;\n        } else {\n            debugPanel.style.display = \"none\"\n        }\n    }\n    //#endregion\n\n    //#endregion\n}",
                "args": [
                    "input",
                    "array"
                ],
                "funcedit": true,
                "argTypes": [],
                "returnType": "",
                "argTypeColors": [],
                "hasfunc": true,
                "funceval": null
            },
            "selected": false,
            "dragging": false,
            "positionAbsolute": {
                "x": -45.08449964736428,
                "y": -432.039633554186
            }
        },
        {
            "width": 176,
            "height": 112,
            "id": "nodular_1693117135705",
            "type": "javascriptNode",
            "position": {
                "x": 214.91550035263572,
                "y": -432.039633554186
            },
            "data": {
                "label": "isinarray",
                "lang": "node",
                "loading": false,
                "func": "//This is the CPU which interacts with the rest of the hardware. It's main task is to performe a CPU Cycle measured in steps per cycle\n//Each Cycle will run  10 steps taking in OPCodes and executing them.\nimport { SPRITE_WIDTH } from \"./Constants/CharSet.js\";\nimport { STEP_SPEED } from \"./Constants/CPUConstants.js\";\nimport { LOAD_PROGRAM_ADDRESS, MEMORY_SIZE } from \"./Constants/MemoryConstants.js\";\nimport { Memory } from \"./memory.js\"\nimport { Registers } from \"./registers.js\";\nimport { Debug } from \"./debug.js\";\nimport { Disassembler } from './disassembler.js';\n\n\nexport class CPU {\n    constructor(display, keyboard, speaker) {\n        //Hardware\n        this.display = display;\n        this.keyboard = keyboard;\n        this.speaker = speaker;\n\n        //CPU Memory\n        this.memory = new Memory();\n        //CPU Registers\n        this.registers = new Registers();\n\n        //Instruction Speed\n        this.speed = STEP_SPEED;\n        //Handles Shift Quirk for Variations of Chip 8\n        this.quirk = \"Shift and Load Qurk\";\n        //Holds the current OpCode Instruction\n\n        this.opcode\n        //Opcode Disassembler\n        this.disassember = new Disassembler();\n\n        this.drawFlag = false;\n\n        this.debug = new Debug();\n    }\n\n    //Resets the CPU\n    reset() {\n        //Reset Memory, Registers, and Display\n        this.memory.reset();\n        this.registers.reset();\n        this.display.reset();\n\n        this.debug.reset();\n    }\n\n    ///Loads a selected rom into an arrayBuffer then calls loadRomIntoMemory\n    async loadRom(romName) {\n        //Get Rom Data\n        const rom = await fetch(`./roms/${romName}`);\n\n        //Load the Rom\n        //Set arrayBuffer to arraybuffer from rom\n        const arrayBuffer = await rom.arrayBuffer();\n        //Set romBuffer to new Uint8Array(arrayBuffer)\n        const romBuffer = new Uint8Array(arrayBuffer);\n\n        //Load rombuffer array into memory\n        this.loadRomIntoMemory(romBuffer);\n\n        //Set pause button text\n        document.getElementById('pause').innerHTML = \"Pause\";\n    }\n\n    //Load a given romBuffer into memory\n    loadRomIntoMemory(romBuffer) {\n        //Reset the emulator\n        this.reset(); //Reset Registers, Memory, and Display\n\n        //Check romBuffer Length + Loader address is less than memory size\n        console.assert(romBuffer.length + LOAD_PROGRAM_ADDRESS <= MEMORY_SIZE, \"Error rom is too large\");\n\n        //Insert rom into memory at location 0x200 which is the address where programs start in chip8\n        this.memory.memory.set(romBuffer, LOAD_PROGRAM_ADDRESS);\n    }\n\n    //CPU Cycle\n    //One CPU Cycle\n    cycle() {\n        //Since this will execute a batch of instructions based on speed will need to have the pause check inside\n        for (let i = 0; i < this.speed; i++) {\n            //Check if paused\n            //Used for programs that check for pause and await input like connect4 and tictac\n            if (!this.registers.paused) {\n                //Execute an instruction step\n                this.step();\n            }\n        }\n\n        //Check if paused\n        if (!this.registers.paused) {\n            //Update system timers\n            this.registers.updateTimers();\n        }\n\n        //Call play sound\n        this.speaker.playSound(this.registers.ST);\n\n        //Render only if flag is true\n        if (this.drawFlag) {\n            //Render display\n            this.display.render();\n            //Set draw flag to false\n            this.drawFlag = false;\n        }\n    }\n\n    //Step executes a cpu instruction and logs registers and instructions\n    //One Chip8 Instruction\n    step() {\n        //Get opcode from memory. Opcode is two bytes\n        this.opcode = this.memory.getOpCode(this.registers.PC); //Error is here\n\n        //Check that the opcode is not 0\n        if (this.opcode !== 0) {\n            //Execute instruction sending opcode\n            this.executeInstruction(this.opcode);\n\n            //If debug mode is active\n            if (this.debug.Active) {\n                // show registers\n                this.debug.DebugRegisters(this);\n            }\n        }\n    }\n\n    //Using Disassembler\n    executeInstruction(opcode) {\n        //Increment the program counter for next instruction\n        //Each instruction is 2 bytes to increment by 2\n        this.registers.PC += 2;\n\n        //Test Disassembler Debug\n        const {\n            instruction,\n            args\n        } = this.disassember.disassemble(opcode);\n        const {\n            id\n        } = instruction;\n\n        //To hex or not to hex?\n        this.debug.logOpcode(`${instruction.id}: 0x${opcode.toString(16)}`)\n\n        //Details on each instruction can be found inside the Constants/InstructinoSet.js file\n        //This includes name, mask, pattern, and arguments\n        switch (id) {\n            //Chip8 Instructions\n            //00E0\n            case 'CLS':\n                this.display.reset();\n                break;\n                //00EE\n            case 'RET':\n                this.registers.PC = this.registers.stackPop();\n                break;\n                //1NNN\n            case 'JP_ADDR':\n                this.registers.PC = args[0];\n                break;\n                //2NNN\n            case 'CALL_ADDR':\n                this.registers.stackPush(this.registers.PC);\n                this.registers.PC = args[0];\n                break;\n                //3XKK\n            case 'SE_VX_KK':\n                if (this.registers.V[args[0]] === args[1]) {\n                    this.registers.PC += 2;\n                }\n                break;\n                //4XKK\n            case 'SNE_VX_KK':\n                if (this.registers.V[args[0]] !== args[1]) {\n                    this.registers.PC += 2;\n                }\n                break;\n                //5XY0\n            case 'SE_VX_VY':\n                if (this.registers.V[args[0]] === this.registers.V[args[1]]) {\n                    this.registers.PC += 2;\n                }\n                break;\n                //6XKK\n            case 'LD_VX_KK':\n                this.registers.V[args[0]] = args[1];\n                break;\n                //7XKK\n            case 'ADD_VX_KK':\n                this.registers.V[args[0]] += args[1];\n                break;\n                //8XY0\n            case 'LD_VX_VY':\n                this.registers.V[args[0]] = this.registers.V[args[1]];\n                break;\n                //8XY1\n            case 'OR_VX_VY':\n                this.registers.V[args[0]] |= this.registers.V[args[1]];\n                break;\n                //8XY2\n            case 'AND_VX_VY':\n                this.registers.V[args[0]] &= this.registers.V[args[1]];\n                break;\n                ////8XY3\n            case 'XOR_VX_VY':\n                this.registers.V[args[0]] ^= this.registers.V[args[1]];\n                break;\n                //8XY4\n            case 'ADD_VX_VY':\n                let sum = (this.registers.V[args[0]] += this.registers.V[args[1]]);\n\n                this.registers.V[0xF] = 0;\n\n                if (sum > 0xFF) {\n                    this.registers.V[0xF] = 1;\n                }\n\n                this.registers.V[args[0]] = sum;\n                break;\n                //8XY5\n            case 'SUB_VX_VY':\n                this.registers.V[0xF] = 0;\n\n                if (this.registers.V[args[0]] > this.registers.V[args[1]]) {\n                    this.registers.V[0xF] = 1;\n                }\n\n                this.registers.V[args[0]] -= this.registers.V[args[1]];\n                break;\n                //8XY6\n            case 'SHR_VX_VY':\n                //Set Vf to result of (Vx & 0x1)\n                this.registers.V[0xF] = (this.registers.V[args[0]] & 0x1);\n\n                //Quirk Behavior\n                if (this.quirk === \"No Quirk\") {\n                    //Original CHIP 8\n                    //Set Vx = Vy shifted to the right 1 bit\n                    this.registers.V[args[0]] = this.registers.V[args[1]] >>= 1;\n                } else {\n                    //Default\n                    //CHIP48 and SCHIP behavior\n                    //Shift Vx to the right 1 bit\n                    this.registers.V[args[0]] >>= 1;\n                }\n                break;\n                //8XY7\n            case 'SUBN_VX_VY':\n                this.registers.V[0xF] = 0;\n\n                if (this.registers.V[args[1]] > this.registers.V[args[0]]) {\n                    this.registers.V[0xF] = 1;\n                }\n\n                this.registers.V[args[0]] = this.registers.V[args[1]] - this.registers.V[args[0]];\n\n                break;\n                //8XYE\n            case 'SHL_VX_VY':\n                this.registers.V[0xF] = (this.registers.V[args[0]] & 0x80);\n                this.registers.V[args[0]] <<= 1;\n                break;\n                //9XY0\n            case 'SNE_VX_VY':\n                if (this.registers.V[args[0]] !== this.registers.V[args[1]]) {\n                    this.registers.PC += 2;\n                }\n                break;\n                //ANNN\n            case 'LD_I_ADDR':\n                this.registers.I = args[0];\n                break;\n                //BNNN\n            case 'JP_V0_ADDR':\n                this.registers.PC = (args[0]) + this.registers.V[0];\n                break;\n                //CXKK\n            case 'RND_VX_KK':\n                let rand = Math.floor(Math.random() * 0xFF);\n\n                this.registers.V[args[0]] = rand & (opcode & 0xFF);\n                break;\n                //DXYN\n            case 'DRW_VX_VY_N':\n                let width = SPRITE_WIDTH;\n                let height = (opcode & 0xF);\n\n                this.registers.V[0xF] = 0;\n\n                for (let row = 0; row < height; row++) {\n                    let sprite = this.memory.memory[this.registers.I + row];\n\n                    for (let col = 0; col < width; col++) {\n                        if ((sprite & 0x80) > 0) {\n                            //If setPixel returns 1, a pixel was erased and set VF to 1\n                            if (this.display.setPixel(this.registers.V[args[0]] + col, this.registers.V[args[1]] + row)) {\n                                this.registers.V[0xF] = 1;\n                            }\n                        }\n                        //Shift the sprite left 1, this will move to the next col/bit\n                        //Ex. 10010000 << 1 will become 0010000\n                        sprite <<= 1;\n                    }\n                }\n\n                this.drawFlag = true;\n                break;\n                //EX9E\n            case 'SKP_VX':\n                if (this.keyboard.isKeyPressed(this.registers.V[args[0]])) {\n                    this.registers.PC += 2;\n                }\n                break;\n                //EXA1\n            case 'SKNP_VX':\n                if (!this.keyboard.isKeyPressed(this.registers.V[args[0]])) {\n                    this.registers.PC += 2;\n                }\n                break;\n                //FX07\n            case 'LD_VX_DT':\n                this.registers.V[args[0]] = this.registers.DT;\n                break;\n                //FX0A\n                //Used in Connect4 and TicTac\n            case 'LD_VX_K':\n                this.registers.paused = true;\n\n                this.keyboard.onNextKeyPress = function(key) {\n                    this.registers.V[args[0]] = key;\n                    this.registers.paused = false;\n                }.bind(this);\n                break;\n                //FX15\n            case 'LD_DT_VX':\n                this.registers.DT = this.registers.V[args[0]];\n                break;\n                //FX18\n            case 'LD_ST_VX':\n                this.registers.ST = this.registers.V[args[0]];\n                break;\n                //FX1E\n            case 'ADD_I_VX':\n                this.registers.I += this.registers.V[args[0]];\n                break;\n                //FX29\n            case 'LD_F_VX':\n                this.registers.I = this.registers.V[args[0]] * 5;\n                break;\n                //FX33\n            case 'LD_B_VX':\n                //Get Hundreds place\n                this.memory.memory[this.registers.I] = parseInt(this.registers.V[args[0]] / 100);\n                //Get Tens place\n                this.memory.memory[this.registers.I + 1] = parseInt((this.registers.V[args[0]] % 100) / 10);\n                //Get Ones place\n                this.memory.memory[this.registers.I + 2] = parseInt(this.registers.V[args[0]] % 10);\n                break;\n                //FX55\n            case 'LD_I_VX':\n                for (let registerIndex = 0; registerIndex <= args[0]; registerIndex++) {\n                    this.memory.memory[this.registers.I + registerIndex] = this.registers.V[registerIndex];\n                }\n\n                //Check for quirk\n                if (this.quirk === \"No Quirk\") {\n                    this.registers.I += args[0] + 1;\n                } else if (this.quirk === \"Shift and Load Quirk\") {\n                    this.registers.I += args[0];\n                }\n                break;\n                //FX65\n            case 'LD_VX_I':\n                for (let registerIndex = 0; registerIndex <= args[0]; registerIndex++) {\n                    this.registers.V[registerIndex] = this.memory.memory[this.registers.I + registerIndex];\n                }\n\n                //Check for quirk\n                if (this.quirk === \"No Quirk\") {\n                    this.registers.I += args[0] + 1;\n                } else if (this.quirk === \"Shift and Load Qurk\") {\n                    this.registers.I += args[0];\n                }\n                break;\n\n\n            default:\n                console.error(`Instruction with id ${id} not found`, instruction, args);\n        }\n    }\n}",
                "args": [
                    "input",
                    "array"
                ],
                "funcedit": true,
                "argTypes": [],
                "returnType": "",
                "argTypeColors": [],
                "hasfunc": true,
                "funceval": null
            },
            "selected": false,
            "dragging": false,
            "positionAbsolute": {
                "x": 214.91550035263572,
                "y": -432.039633554186
            }
        },
        {
            "width": 176,
            "height": 112,
            "id": "nodular_1693117138939",
            "type": "javascriptNode",
            "position": {
                "x": 230.91550035263572,
                "y": -230.03963355418603
            },
            "data": {
                "label": "isinarray",
                "lang": "node",
                "loading": false,
                "func": "//Imports\nimport { INSTRUCTION_SET } from './Constants/InstructionSet.js';\n\n//Export class\nexport class Disassembler {\n\n  //Disassemble a given opcode\n  disassemble(opcode) {\n      //Constants\n      //instruction set to found instruction from the InstructionSet\n      const instruction = INSTRUCTION_SET.find(\n          //opcode & bitwise instruction.mask === instruction.pattern\n          (instruction) => (opcode & instruction.mask) === instruction.pattern\n      );\n      //args = instruction.argurments\n      const args = instruction.arguments.map(\n          //opcode & arg.mask >> arg.shift\n          (arg) => (opcode & arg.mask) >> arg.shift\n      );\n\n      //Return instruction, args\n      return {\n          instruction,\n          args\n      };\n  }\n}",
                "args": [
                    "input",
                    "array"
                ],
                "funcedit": true,
                "argTypes": [],
                "returnType": "",
                "argTypeColors": [],
                "hasfunc": true,
                "funceval": null
            },
            "selected": false,
            "dragging": false,
            "positionAbsolute": {
                "x": 230.91550035263572,
                "y": -230.03963355418603
            }
        },
        {
            "width": 176,
            "height": 112,
            "id": "nodular_1693117141000",
            "type": "javascriptNode",
            "position": {
                "x": 510.9155003526357,
                "y": -422.039633554186
            },
            "data": {
                "label": "isinarray",
                "lang": "node",
                "loading": false,
                "func": "//This is the CPU which interacts with the rest of the hardware. It's main task is to performe a CPU Cycle measured in steps per cycle\n//Each Cycle will run  10 steps taking in OPCodes and executing them.\nimport { SPRITE_WIDTH } from \"./Constants/CharSet.js\";\nimport { STEP_SPEED } from \"./Constants/CPUConstants.js\";\nimport { LOAD_PROGRAM_ADDRESS, MEMORY_SIZE } from \"./Constants/MemoryConstants.js\";\nimport { Memory } from \"./memory.js\"\nimport { Registers } from \"./registers.js\";\nimport { Debug } from \"./debug.js\";\nimport { Disassembler } from './disassembler.js';\n\n\nexport class CPU {\n    constructor(display, keyboard, speaker) {\n        //Hardware\n        this.display = display;\n        this.keyboard = keyboard;\n        this.speaker = speaker;\n\n        //CPU Memory\n        this.memory = new Memory();\n        //CPU Registers\n        this.registers = new Registers();\n\n        //Instruction Speed\n        this.speed = STEP_SPEED;\n        //Handles Shift Quirk for Variations of Chip 8\n        this.quirk = \"Shift and Load Qurk\";\n        //Holds the current OpCode Instruction\n\n        this.opcode\n        //Opcode Disassembler\n        this.disassember = new Disassembler();\n\n        this.drawFlag = false;\n\n        this.debug = new Debug();\n    }\n\n    //Resets the CPU\n    reset() {\n        //Reset Memory, Registers, and Display\n        this.memory.reset();\n        this.registers.reset();\n        this.display.reset();\n\n        this.debug.reset();\n    }\n\n    ///Loads a selected rom into an arrayBuffer then calls loadRomIntoMemory\n    async loadRom(romName) {\n        //Get Rom Data\n        const rom = await fetch(`./roms/${romName}`);\n\n        //Load the Rom\n        //Set arrayBuffer to arraybuffer from rom\n        const arrayBuffer = await rom.arrayBuffer();\n        //Set romBuffer to new Uint8Array(arrayBuffer)\n        const romBuffer = new Uint8Array(arrayBuffer);\n\n        //Load rombuffer array into memory\n        this.loadRomIntoMemory(romBuffer);\n\n        //Set pause button text\n        document.getElementById('pause').innerHTML = \"Pause\";\n    }\n\n    //Load a given romBuffer into memory\n    loadRomIntoMemory(romBuffer) {\n        //Reset the emulator\n        this.reset(); //Reset Registers, Memory, and Display\n\n        //Check romBuffer Length + Loader address is less than memory size\n        console.assert(romBuffer.length + LOAD_PROGRAM_ADDRESS <= MEMORY_SIZE, \"Error rom is too large\");\n\n        //Insert rom into memory at location 0x200 which is the address where programs start in chip8\n        this.memory.memory.set(romBuffer, LOAD_PROGRAM_ADDRESS);\n    }\n\n    //CPU Cycle\n    //One CPU Cycle\n    cycle() {\n        //Since this will execute a batch of instructions based on speed will need to have the pause check inside\n        for (let i = 0; i < this.speed; i++) {\n            //Check if paused\n            //Used for programs that check for pause and await input like connect4 and tictac\n            if (!this.registers.paused) {\n                //Execute an instruction step\n                this.step();\n            }\n        }\n\n        //Check if paused\n        if (!this.registers.paused) {\n            //Update system timers\n            this.registers.updateTimers();\n        }\n\n        //Call play sound\n        this.speaker.playSound(this.registers.ST);\n\n        //Render only if flag is true\n        if (this.drawFlag) {\n            //Render display\n            this.display.render();\n            //Set draw flag to false\n            this.drawFlag = false;\n        }\n    }\n\n    //Step executes a cpu instruction and logs registers and instructions\n    //One Chip8 Instruction\n    step() {\n        //Get opcode from memory. Opcode is two bytes\n        this.opcode = this.memory.getOpCode(this.registers.PC); //Error is here\n\n        //Check that the opcode is not 0\n        if (this.opcode !== 0) {\n            //Execute instruction sending opcode\n            this.executeInstruction(this.opcode);\n\n            //If debug mode is active\n            if (this.debug.Active) {\n                // show registers\n                this.debug.DebugRegisters(this);\n            }\n        }\n    }\n\n    //Using Disassembler\n    executeInstruction(opcode) {\n        //Increment the program counter for next instruction\n        //Each instruction is 2 bytes to increment by 2\n        this.registers.PC += 2;\n\n        //Test Disassembler Debug\n        const {\n            instruction,\n            args\n        } = this.disassember.disassemble(opcode);\n        const {\n            id\n        } = instruction;\n\n        //To hex or not to hex?\n        this.debug.logOpcode(`${instruction.id}: 0x${opcode.toString(16)}`)\n\n        //Details on each instruction can be found inside the Constants/InstructinoSet.js file\n        //This includes name, mask, pattern, and arguments\n        switch (id) {\n            //Chip8 Instructions\n            //00E0\n            case 'CLS':\n                this.display.reset();\n                break;\n                //00EE\n            case 'RET':\n                this.registers.PC = this.registers.stackPop();\n                break;\n                //1NNN\n            case 'JP_ADDR':\n                this.registers.PC = args[0];\n                break;\n                //2NNN\n            case 'CALL_ADDR':\n                this.registers.stackPush(this.registers.PC);\n                this.registers.PC = args[0];\n                break;\n                //3XKK\n            case 'SE_VX_KK':\n                if (this.registers.V[args[0]] === args[1]) {\n                    this.registers.PC += 2;\n                }\n                break;\n                //4XKK\n            case 'SNE_VX_KK':\n                if (this.registers.V[args[0]] !== args[1]) {\n                    this.registers.PC += 2;\n                }\n                break;\n                //5XY0\n            case 'SE_VX_VY':\n                if (this.registers.V[args[0]] === this.registers.V[args[1]]) {\n                    this.registers.PC += 2;\n                }\n                break;\n                //6XKK\n            case 'LD_VX_KK':\n                this.registers.V[args[0]] = args[1];\n                break;\n                //7XKK\n            case 'ADD_VX_KK':\n                this.registers.V[args[0]] += args[1];\n                break;\n                //8XY0\n            case 'LD_VX_VY':\n                this.registers.V[args[0]] = this.registers.V[args[1]];\n                break;\n                //8XY1\n            case 'OR_VX_VY':\n                this.registers.V[args[0]] |= this.registers.V[args[1]];\n                break;\n                //8XY2\n            case 'AND_VX_VY':\n                this.registers.V[args[0]] &= this.registers.V[args[1]];\n                break;\n                ////8XY3\n            case 'XOR_VX_VY':\n                this.registers.V[args[0]] ^= this.registers.V[args[1]];\n                break;\n                //8XY4\n            case 'ADD_VX_VY':\n                let sum = (this.registers.V[args[0]] += this.registers.V[args[1]]);\n\n                this.registers.V[0xF] = 0;\n\n                if (sum > 0xFF) {\n                    this.registers.V[0xF] = 1;\n                }\n\n                this.registers.V[args[0]] = sum;\n                break;\n                //8XY5\n            case 'SUB_VX_VY':\n                this.registers.V[0xF] = 0;\n\n                if (this.registers.V[args[0]] > this.registers.V[args[1]]) {\n                    this.registers.V[0xF] = 1;\n                }\n\n                this.registers.V[args[0]] -= this.registers.V[args[1]];\n                break;\n                //8XY6\n            case 'SHR_VX_VY':\n                //Set Vf to result of (Vx & 0x1)\n                this.registers.V[0xF] = (this.registers.V[args[0]] & 0x1);\n\n                //Quirk Behavior\n                if (this.quirk === \"No Quirk\") {\n                    //Original CHIP 8\n                    //Set Vx = Vy shifted to the right 1 bit\n                    this.registers.V[args[0]] = this.registers.V[args[1]] >>= 1;\n                } else {\n                    //Default\n                    //CHIP48 and SCHIP behavior\n                    //Shift Vx to the right 1 bit\n                    this.registers.V[args[0]] >>= 1;\n                }\n                break;\n                //8XY7\n            case 'SUBN_VX_VY':\n                this.registers.V[0xF] = 0;\n\n                if (this.registers.V[args[1]] > this.registers.V[args[0]]) {\n                    this.registers.V[0xF] = 1;\n                }\n\n                this.registers.V[args[0]] = this.registers.V[args[1]] - this.registers.V[args[0]];\n\n                break;\n                //8XYE\n            case 'SHL_VX_VY':\n                this.registers.V[0xF] = (this.registers.V[args[0]] & 0x80);\n                this.registers.V[args[0]] <<= 1;\n                break;\n                //9XY0\n            case 'SNE_VX_VY':\n                if (this.registers.V[args[0]] !== this.registers.V[args[1]]) {\n                    this.registers.PC += 2;\n                }\n                break;\n                //ANNN\n            case 'LD_I_ADDR':\n                this.registers.I = args[0];\n                break;\n                //BNNN\n            case 'JP_V0_ADDR':\n                this.registers.PC = (args[0]) + this.registers.V[0];\n                break;\n                //CXKK\n            case 'RND_VX_KK':\n                let rand = Math.floor(Math.random() * 0xFF);\n\n                this.registers.V[args[0]] = rand & (opcode & 0xFF);\n                break;\n                //DXYN\n            case 'DRW_VX_VY_N':\n                let width = SPRITE_WIDTH;\n                let height = (opcode & 0xF);\n\n                this.registers.V[0xF] = 0;\n\n                for (let row = 0; row < height; row++) {\n                    let sprite = this.memory.memory[this.registers.I + row];\n\n                    for (let col = 0; col < width; col++) {\n                        if ((sprite & 0x80) > 0) {\n                            //If setPixel returns 1, a pixel was erased and set VF to 1\n                            if (this.display.setPixel(this.registers.V[args[0]] + col, this.registers.V[args[1]] + row)) {\n                                this.registers.V[0xF] = 1;\n                            }\n                        }\n                        //Shift the sprite left 1, this will move to the next col/bit\n                        //Ex. 10010000 << 1 will become 0010000\n                        sprite <<= 1;\n                    }\n                }\n\n                this.drawFlag = true;\n                break;\n                //EX9E\n            case 'SKP_VX':\n                if (this.keyboard.isKeyPressed(this.registers.V[args[0]])) {\n                    this.registers.PC += 2;\n                }\n                break;\n                //EXA1\n            case 'SKNP_VX':\n                if (!this.keyboard.isKeyPressed(this.registers.V[args[0]])) {\n                    this.registers.PC += 2;\n                }\n                break;\n                //FX07\n            case 'LD_VX_DT':\n                this.registers.V[args[0]] = this.registers.DT;\n                break;\n                //FX0A\n                //Used in Connect4 and TicTac\n            case 'LD_VX_K':\n                this.registers.paused = true;\n\n                this.keyboard.onNextKeyPress = function(key) {\n                    this.registers.V[args[0]] = key;\n                    this.registers.paused = false;\n                }.bind(this);\n                break;\n                //FX15\n            case 'LD_DT_VX':\n                this.registers.DT = this.registers.V[args[0]];\n                break;\n                //FX18\n            case 'LD_ST_VX':\n                this.registers.ST = this.registers.V[args[0]];\n                break;\n                //FX1E\n            case 'ADD_I_VX':\n                this.registers.I += this.registers.V[args[0]];\n                break;\n                //FX29\n            case 'LD_F_VX':\n                this.registers.I = this.registers.V[args[0]] * 5;\n                break;\n                //FX33\n            case 'LD_B_VX':\n                //Get Hundreds place\n                this.memory.memory[this.registers.I] = parseInt(this.registers.V[args[0]] / 100);\n                //Get Tens place\n                this.memory.memory[this.registers.I + 1] = parseInt((this.registers.V[args[0]] % 100) / 10);\n                //Get Ones place\n                this.memory.memory[this.registers.I + 2] = parseInt(this.registers.V[args[0]] % 10);\n                break;\n                //FX55\n            case 'LD_I_VX':\n                for (let registerIndex = 0; registerIndex <= args[0]; registerIndex++) {\n                    this.memory.memory[this.registers.I + registerIndex] = this.registers.V[registerIndex];\n                }\n\n                //Check for quirk\n                if (this.quirk === \"No Quirk\") {\n                    this.registers.I += args[0] + 1;\n                } else if (this.quirk === \"Shift and Load Quirk\") {\n                    this.registers.I += args[0];\n                }\n                break;\n                //FX65\n            case 'LD_VX_I':\n                for (let registerIndex = 0; registerIndex <= args[0]; registerIndex++) {\n                    this.registers.V[registerIndex] = this.memory.memory[this.registers.I + registerIndex];\n                }\n\n                //Check for quirk\n                if (this.quirk === \"No Quirk\") {\n                    this.registers.I += args[0] + 1;\n                } else if (this.quirk === \"Shift and Load Qurk\") {\n                    this.registers.I += args[0];\n                }\n                break;\n\n\n            default:\n                console.error(`Instruction with id ${id} not found`, instruction, args);\n        }\n    }\n}",
                "args": [
                    "input",
                    "array"
                ],
                "funcedit": true,
                "argTypes": [],
                "returnType": "",
                "argTypeColors": [],
                "hasfunc": true,
                "funceval": null
            },
            "selected": false,
            "dragging": false,
            "positionAbsolute": {
                "x": 510.9155003526357,
                "y": -422.039633554186
            }
        },
        {
            "width": 176,
            "height": 112,
            "id": "nodular_1693117142602",
            "type": "javascriptNode",
            "position": {
                "x": -33.08449964736428,
                "y": -246.03963355418603
            },
            "data": {
                "label": "isinarray",
                "lang": "node",
                "loading": false,
                "func": "//Export Class\n//Used to log all debug features\nexport class Debug {\n    //Called when a new instance of the class is created\n    constructor() {\n        //Debug Properties\n        this.opcodeLogs = new Array();\n\n        this.Active = false;\n    }\n\n    //Reset function\n    reset() {\n        this.opcodeLogs.fill(0);\n    }\n\n    logOpcode(msg) {\n        this.opcodeLogs.push(msg);\n    }\n\n    printLast() {\n        console.log(this.opcodeLogs[this.opcodeLogs.length - 1]);\n    }\n\n    //Updates the Register UI\n    DebugRegisters(cpu) {\n        //Load Registers\n        //16 bit V register\n        cpu.registers.V.forEach((x, index) => {\n            document.getElementById(`V${index}`).innerHTML = `0x${x.toString(16)}`;\n        });\n        //I register\n        document.getElementById(\"I\").innerHTML = `0x${cpu.registers.I.toString(16)}`;\n        //Program Counter\n        document.getElementById(\"PC\").innerHTML = `0x${cpu.registers.PC.toString(16)}`;\n        //Delay Timer\n        document.getElementById(\"DT\").innerHTML = `0x${cpu.registers.DT.toString(16)}`;\n        //Sound Timer\n        document.getElementById('ST').innerHTML = `0x${cpu.registers.ST.toString(16)}`;\n    }\n\n    //Updates the fpsCounter UI\n    ShowFPS(fps) {\n        //Get DOM element\n        let counter = document.getElementById('fpsCounter');\n\n        //Set innerHTML to fps variable\n        counter.innerHTML = fps;\n    }\n}",
                "args": [
                    "input",
                    "array"
                ],
                "funcedit": true,
                "argTypes": [],
                "returnType": "",
                "argTypeColors": [],
                "hasfunc": true,
                "funceval": null
            },
            "selected": false,
            "dragging": false,
            "positionAbsolute": {
                "x": -33.08449964736428,
                "y": -246.03963355418603
            }
        },
        {
            "width": 176,
            "height": 112,
            "id": "nodular_1693117144264",
            "type": "javascriptNode",
            "position": {
                "x": 512.9155003526357,
                "y": -220.03963355418603
            },
            "data": {
                "label": "isinarray",
                "lang": "node",
                "loading": false,
                "func": "import { BG_COLOR, COLOR, DISPLAY_HEIGHT, DISPLAY_WIDTH, SCALE } from \"./Constants/DisplayConstants.js\";\n\nexport class Display {\n    constructor() {\n        //Display properties\n        this.scale = SCALE; //Screen Scale\n        this.bgColor = BG_COLOR; //Background Color\n        this.color = COLOR; //Fore Color\n\n        //Get Screen and Context\n        this.screen = document.querySelector('canvas'); //Screen\n        this.context = this.screen.getContext('2d'); //2D Context\n\n        //Create a frameBuffer to hold all of the pixels\n        this.frameBuffer = new Array(DISPLAY_WIDTH * DISPLAY_HEIGHT); //Frame Buffer array\n\n        //Call Reset\n        this.reset();\n    }\n\n    //Reset the display\n    reset() {\n        //Clear the array of pixels by filling with 0s\n        this.frameBuffer.fill(0);\n        //Set the fill style to background color\n        this.context.fillStyle = this.bgColor;\n        //Fill the screen\n        this.context.fillRect(0, 0, this.screen.width, this.screen.height);\n\n        //Render display\n        this.render();\n    }\n\n    //Scales the screen by multiplying the scale against the default height and width\n    scaleScreen() {\n        //Set screen width and height and scale it\n        this.screen.width = DISPLAY_WIDTH * this.scale;\n        this.screen.height = DISPLAY_HEIGHT * this.scale;\n    }\n\n    //Sets a pixel to 1 or 0 inside the frameBuffer by XOR pixels\n    setPixel(x, y) {\n        //Constant Pixel X and Pixel Y location\n        //Calculate using modulo to handle screen wrap\n        const px = x % DISPLAY_WIDTH;\n        const py = y % DISPLAY_HEIGHT;\n\n        //Set pixelLocation to px + (py * width of the display constant)\n        let pixelLoc = px + (py * DISPLAY_WIDTH);\n\n        //Set pixel inside frameBuffer[pixelLoc as index] to XOR bitwise operation 0 or 1\n        this.frameBuffer[pixelLoc] ^= 1;\n\n        //Opposite Return if pixel was erased. 1 true for erased, 0 false for nothing erased\n        return !this.frameBuffer[pixelLoc];\n    }\n\n    render() {\n        //Scale the screen first\n        this.scaleScreen();\n\n        //Clear the canvas\n        this.context.clearRect(0, 0, this.screen.width, this.screen.height);\n        //Set background color\n        this.context.fillStyle = this.bgColor;\n        //Fill the canvas\n        this.context.fillRect(0, 0, this.screen.width, this.screen.height);\n\n        //Loop through the display width * height\n        for (let i = 0; i < DISPLAY_WIDTH * DISPLAY_HEIGHT; i++) {\n            //Get x location (i mod width) * scale\n            let x = (i % DISPLAY_WIDTH) * this.scale;\n\n            //Get y = Math.floor(i divide width) * scale\n            let y = Math.floor(i / DISPLAY_WIDTH) * this.scale;\n\n            //Check the frame buffer at location i for 0 or 1\n            if (this.frameBuffer[i]) {\n                //Set the fillstyle to color\n                this.context.fillStyle = this.color;\n\n                //Fill a new rectangle at location x,y setting its size to scale variable\n                this.context.fillRect(x, y, this.scale, this.scale);\n            }\n        }\n    }\n\n}",
                "args": [
                    "input",
                    "array"
                ],
                "funcedit": true,
                "argTypes": [],
                "returnType": "",
                "argTypeColors": [],
                "hasfunc": true,
                "funceval": null
            },
            "selected": false,
            "dragging": false,
            "positionAbsolute": {
                "x": 512.9155003526357,
                "y": -220.03963355418603
            }
        },
        {
            "width": 176,
            "height": 112,
            "id": "nodular_1693117151624",
            "type": "javascriptNode",
            "position": {
                "x": -33.08449964736428,
                "y": -22.039633554186025
            },
            "data": {
                "label": "isinarray",
                "lang": "node",
                "loading": false,
                "func": "//Imports\nimport { KEYMAP, NUMBER_OF_KEYS } from \"./Constants/KeyboardConstants.js\";\n\n//Export Class\nexport class Keyboard {\n    //Called when a new instance of the class is created\n    constructor() {\n        //Keyboard properties\n        //Keymap set to constant KEYMAP\n        this.KEYMAP = KEYMAP;\n        //keyPressed Array to size of keyboard fill with false\n        this.keyPressed = new Array(NUMBER_OF_KEYS).fill(false);\n\n        //onNextKeyPress to hold \n        this.onNextKeyPress = null;\n\n        //Add keydown and keyup event listeners to the window\n        window.addEventListener('keydown', this.onKeyDown.bind(this), false);\n        window.addEventListener('keyup', this.onKeyUp.bind(this), false);\n    }\n\n    //check if the provided keycode is pressed(true) in the array\n    isKeyPressed(keyCode) {\n        //Return value from keyPressed array using the provided value as an index     \n        return this.keyPressed[keyCode];\n    }\n\n    //onKeyDown Event for the window\n    onKeyDown(event) {\n        //Get key from keymap\n        let key = this.KEYMAP[event.which];\n\n        //Check that the key exists in the keymap\n        if (key != undefined) {\n            //Set keypressed at index key to true\n            this.keyPressed[key] = true;\n\n            // Make sure onNextKeyPress is initialized and the pressed key is actually mapped to a Chip-8 key\n            if (this.onNextKeyPress !== null && key) {\n                //parseInt the key pressed for onNextKeyPress\n                this.onNextKeyPress(parseInt(key));\n                //Set onNextKeyPress to null\n                this.onNextKeyPress = null;\n            }\n        }\n    }\n\n    //onKeyUp Event for the window\n    onKeyUp(event) {\n        //Get key from keymap\n        let key = this.KEYMAP[event.which];\n\n        //Check that the key exists in the keymap\n        if (!key != undefined) {\n            //Set keypressed at index key to true\n            this.keyPressed[key] = false;\n        }\n    }\n}",
                "args": [
                    "input",
                    "array"
                ],
                "funcedit": true,
                "argTypes": [],
                "returnType": "",
                "argTypeColors": [],
                "hasfunc": true,
                "funceval": null
            },
            "selected": false,
            "dragging": false,
            "positionAbsolute": {
                "x": -33.08449964736428,
                "y": -22.039633554186025
            }
        },
        {
            "width": 176,
            "height": 112,
            "id": "nodular_1693117152644",
            "type": "javascriptNode",
            "position": {
                "x": 238.91550035263572,
                "y": -14.039633554185912
            },
            "data": {
                "label": "isinarray",
                "lang": "node",
                "loading": false,
                "func": "//Imports from constants folder\nimport { MEMORY_SIZE, SPRITE_SET_ADDRESS } from \"./Constants/MemoryConstants.js\";\nimport { SPRITES } from \"./Constants/CharSet.js\";\n\n//Export Class\nexport class Memory {\n    //Called when a new instance of the class is created\n    constructor() {\n        //Memory properties\n        //Create a new Uint8Array called memory and set it's size to 4kb of memory\n        this.memory = new Uint8Array(MEMORY_SIZE);\n        //Call reset on creation\n        this.reset();\n    }\n\n    //Reset Memory\n    reset() {\n        //Clear out the array by filling it with 0\n        this.memory.fill(0)\n        //Load sprites into the array at the sprite_set_address\n        this.memory.set(SPRITES, SPRITE_SET_ADDRESS);\n    }\n\n    //Set Memory at location index\n    setMemory(index, value) {\n        //Verify memory location\n        this.assertMemory(index);\n        //Set location value\n        this.memory[index] = value;\n    }\n\n    //Get Memory at location index\n    getMemory(index) {\n        //Verify memory location\n        this.assertMemory(index);\n        //Return memory location value\n        return this.memory[index];\n    }\n\n    //Get Opcode from memory at location index\n    //Opcodes are two bytes\n    getOpCode(index) {\n        //Get the high byte from the index\n        const highByte = this.getMemory(index);\n        //Get the low byte from the index + 1\n        const lowByte = this.getMemory(index + 1);\n        //Return the opcode\n        return (highByte << 8) | lowByte;\n    }\n\n    //Verify Memory is within the bounds of the array\n    assertMemory(index) {\n        console.assert(index >= 0 && index < MEMORY_SIZE, `Error trying to access memory at index ${index}`);\n    }\n}",
                "args": [
                    "input",
                    "array"
                ],
                "funcedit": true,
                "argTypes": [],
                "returnType": "",
                "argTypeColors": [],
                "hasfunc": true,
                "funceval": null
            },
            "selected": false,
            "dragging": false,
            "positionAbsolute": {
                "x": 238.91550035263572,
                "y": -14.039633554185912
            }
        },
        {
            "width": 176,
            "height": 112,
            "id": "nodular_1693117153766",
            "type": "javascriptNode",
            "position": {
                "x": 354.9155003526357,
                "y": 271.9603664458141
            },
            "data": {
                "label": "isinarray",
                "lang": "node",
                "loading": false,
                "func": "//Class to be exported to other classes\nexport class Speaker {\n    //Called when creating an instance of the class\n    constructor() {\n        //Speaker properties\n        this.isMute = false;\n        this.soundEnabled = false; //Holds whether the sound is enabled or not. Object defined in speaker init function\n        this.volumeLevel = 0.3; //Holds the volume level of the speaker\n        this.wave = \"square\"; //Holds the wave of the oscillator\n\n        //Initialize speaker\n        speakerInit(this);\n    }\n\n    //Funtions\n    //Enables the sound Card\n    enableSound() {\n        this.soundEnabled = true;\n    }\n\n    //Disables the sound Card\n    disableSound() {\n        this.soundEnabled = false;\n    }\n\n    //User Controlled\n    mute() {\n        //Set audio level to 0\n        this.volumeLevel = 0.0;\n    }\n\n    unMute(value) {\n        //Set audio level to incoming value\n        //This will help when volume has been changed while the speaker is muted\n        this.volumeLevel = value;\n    }\n\n    //Play Sound based on sound timer value\n    playSound(st) {\n        if (st > 0) {\n            //Play\n            this.enableSound();\n        } else {\n            //Stop\n            this.disableSound();\n        }\n    }\n}\n\n//Initialization function\n//This creates the property soundEnabled for the speaker as well as creating the gain and audio context. It does not need to be exported.\nfunction speakerInit(speaker) {\n    //Check if browser supports audio context\n    if (\"AudioContext\" in window || \"webkitAudioContext\" in window) {\n        //Create audioContext and masterGain\n        const audioContext = new(AudioContext || webkitAudioContext)(); //Create an audio Context\n        const masterGain = new GainNode(audioContext); //Create a masterGain GainNode\n\n        //connect the masterGain to the audio context\n        masterGain.connect(audioContext.destination);\n\n        //Create variables soundEnabled and Oscillator\n        let soundEnabled = false;\n        let oscillator;\n\n        //Create an object and define its properties to speaker\n        Object.defineProperties(speaker, {\n            //Sound Enabled Property\n            soundEnabled: {\n                //Getter\n                get: function() {\n                    return soundEnabled;\n                },\n                //Setter\n                set: function(value) {\n                    //if incomming value already is equal to soundEnabled exit function\n                    if (value === soundEnabled) {\n                        return\n                    }\n\n                    //Set soundEnabled to incoming value\n                    soundEnabled = value;\n\n                    //Check soundEnabled true\n                    if (soundEnabled) {\n                        //Set masterGain gain value here so volume control works\n                        masterGain.gain.value = speaker.volumeLevel;\n                        //Start Oscillator giving it the audiocontext and the wave\n                        oscillator = new OscillatorNode(audioContext, {\n                            type: speaker.wave\n                        });\n                        //Connect the oscillator to the mastergain\n                        oscillator.connect(masterGain);\n                        //Start the oscillator\n                        oscillator.start();\n                    } else {\n                        //Stop the Oscillator\n                        oscillator.stop();\n                    }\n                }\n            }\n        })\n    }\n}",
                "args": [
                    "input",
                    "array"
                ],
                "funcedit": true,
                "argTypes": [],
                "returnType": "",
                "argTypeColors": [],
                "hasfunc": true,
                "funceval": null
            },
            "selected": true,
            "dragging": false,
            "positionAbsolute": {
                "x": 354.9155003526357,
                "y": 271.9603664458141
            }
        },
        {
            "width": 176,
            "height": 112,
            "id": "nodular_1693117154441",
            "type": "javascriptNode",
            "position": {
                "x": 524.9155003526357,
                "y": -30.03963355418591
            },
            "data": {
                "label": "isinarray",
                "lang": "node",
                "loading": false,
                "func": "//Imports\nimport { LOAD_PROGRAM_ADDRESS } from \"./Constants/MemoryConstants.js\";\nimport { NUMBER_OF_REGISTERS, STACK_DEEP } from \"./Constants/RegisterConstants.js\";\n\n//Export Class\nexport class Registers {\n    //Called when a new instance of the class is created\n    constructor() {\n        //Register properties\n        this.V = new Uint8Array(NUMBER_OF_REGISTERS); //16 8-bit registers\n        this.I = 0; //Memory Address\n        this.stack = new Uint16Array(STACK_DEEP); //Operation Stack\n        this.SP = -1; //Stack pointer\n        this.PC = LOAD_PROGRAM_ADDRESS; //Program Counter set to Program starting address\n\n        this.DT = 0; //Delay Timer\n        this.ST = 0; //Sound Timer\n\n        this.paused = false; //Pause register\n    }\n\n    //Reset all variables\n    reset() {\n        this.V.fill(0);\n        this.I = 0;\n        this.stack.fill(0);\n        this.SP = -1;\n        this.PC = LOAD_PROGRAM_ADDRESS;\n\n        this.DT = 0;\n        this.ST = 0;\n\n        this.paused = false;\n    }\n\n    //Push new value to stack\n    stackPush(value) {\n        //Increase the Stack Position\n        this.SP++;\n        //Assert the Stack is not Overflowing\n        this.assertStackOverflow();\n        //Push a value to the stack at index Stack Position\n        this.stack[this.SP] = value\n    }\n\n    //Pop a new value from the stack\n    stackPop() {\n        //Set value to Stack index of Stack Position\n        const value = this.stack[this.SP];\n        //Decrease Stack Position\n        this.SP--;\n        //Assert the Stack is not Underflow\n        this.assertStackUnderflow();\n        //Return the value\n        return value;\n    }\n\n    //Assert the Stack is not Overflowing\n    assertStackOverflow() {\n        //Assert the Stack is less than the Stack Depth\n        console.assert(this.SP < STACK_DEEP, 'Error stack Overflow')\n    }\n\n    //Assert the Stack is not Underflowed\n    assertStackUnderflow() {\n        //Assert the Stack Position is greater than or equal to -1\n        console.assert(this.SP >= -1, 'Error stack underflow')\n    }\n\n    //Update system timers\n    updateTimers() {\n        if (this.DT > 0) {\n            this.DT -= 1;\n        }\n\n        if (this.ST > 0) {\n            this.ST -= 1;\n        }\n    }\n}",
                "args": [
                    "input",
                    "array"
                ],
                "funcedit": true,
                "argTypes": [],
                "returnType": "",
                "argTypeColors": [],
                "hasfunc": true,
                "funceval": null
            },
            "selected": false,
            "dragging": false,
            "positionAbsolute": {
                "x": 524.9155003526357,
                "y": -30.03963355418591
            }
        },
        {
            "width": 176,
            "height": 112,
            "id": "nodular_1693117155179",
            "type": "javascriptNode",
            "position": {
                "x": -21.084499647364282,
                "y": 241.9603664458141
            },
            "data": {
                "label": "isinarray",
                "lang": "node",
                "loading": false,
                "func": "export class Settings {\n    constructor() {\n\n    }\n\n    save(name, value) {\n        // Check browser support\n        if (typeof(Storage) !== \"undefined\") {\n            // Store\n            localStorage.setItem(name, value);\n            console.log(`${name} ${value}`)\n\n        } else {\n            alert(\"Sorry, your browser does not support Web Storage...\");\n        }\n    }\n\n    load(cpu) {\n        // Check browser support\n        if (typeof(Storage) !== \"undefined\") {\n            //Load\n            if (localStorage.length > 0) {\n                //CPU \n                cpu.speed = localStorage.getItem(\"speed\");\n                cpu.quirk = localStorage.getItem(\"quirk\");\n\n                // //Display\n                cpu.display.scale = localStorage.getItem(\"scale\");\n\n                cpu.display.bgColor = localStorage.getItem(\"bgColor\");\n                cpu.display.color = localStorage.getItem(\"color\");\n\n                // // //Sound\n                cpu.speaker.volumeLevel = localStorage.getItem(\"volume\");\n                cpu.speaker.wave = localStorage.getItem(\"wave\");\n\n                //cpu.speaker.isMute = localStorage.getItem(\"mute\");\n            }\n\n\n        } else {\n            alert(\"Sorry, your browser does not support Web Storage...\");\n        }\n    }\n}",
                "args": [
                    "input",
                    "array"
                ],
                "funcedit": true,
                "argTypes": [],
                "returnType": "",
                "argTypeColors": [],
                "hasfunc": true,
                "funceval": null
            },
            "selected": false,
            "dragging": false,
            "positionAbsolute": {
                "x": -21.084499647364282,
                "y": 241.9603664458141
            }
        }
    ],
    "edges": [],
    "viewport": {
        "x": 405.54224982368214,
        "y": 193.01981677709296,
        "zoom": 0.5
    }
}