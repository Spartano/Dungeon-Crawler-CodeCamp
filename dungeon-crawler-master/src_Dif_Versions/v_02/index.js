require('./styles/main.sass'); // root stylesheeet - .css, .scss or .sass

import React, { Component } from 'react';
import update from 'react-addons-update';
import ReactDOM from 'react-dom';
import _ from 'lodash';

///////////////////// initial state and reducers go here//////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////////////////////


////////////////////////////////// actions go here //////////////////////////////////////

/////////////////////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////algorithm part//////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////

//settings
const GRID_HEIGHT = 40;
const GRID_WIDTH = 40;
const MAX_ROOMS = 15;
const ROOM_SIZE_RANGE = [7, 12];

const c= { GRID_HEIGHT, GRID_WIDTH, MAX_ROOMS, ROOM_SIZE_RANGE};

const createDungeon = () => {
	// HELPER FUNCTIONS FOR CREATING THE MAP
	const isValidRoomPlacement = (grid, {x, y, width = 1, height = 1}) => {
		// check if on the edge of or outside of the grid
		if (y < 1 || y + height > grid.length - 1) {
			return false;
		}
		if (x < 1 || x + width > grid[0].length - 1) {
			return false;
		}

		// check if on or adjacent to existing room
		for (let i = y - 1; i < y + height + 1; i++) {
			for (let j = x - 1; j < x + width + 1; j++) {
				if (grid[i][j].type === 'floor') {
					return false;
				}
			}
		}
		// all grid cells are clear
		return true;
	};

	const placeCells = (grid, {x, y, width = 1, height = 1}, type = 'floor') => {
		for (let i = y; i < y + height; i++) {
			for (let j = x; j < x + width; j++) {
				grid[i][j] = {type};
			}
		}
		return grid;
	};

	const createRoomsFromSeed = (grid, {x, y, width, height}, range = c.ROOM_SIZE_RANGE) => {
		// range for generating the random room heights and widths
		const [min, max] = range;

		// generate room values for each edge of the seed room
		const roomValues = [];

		const north = { height: _.random(min, max), width: _.random(min, max) };
		north.x = _.random(x, x + width - 1);
		north.y = y - north.height - 1;
		north.doorx = _.random(north.x, (Math.min(north.x + north.width, x + width)) - 1);
		north.doory = y - 1;
		roomValues.push(north);

		const east = { height: _.random(min, max), width: _.random(min, max) };
		east.x = x + width + 1;
		east.y = _.random(y, height + y - 1);
		east.doorx = east.x - 1;
		east.doory = _.random(east.y, (Math.min(east.y + east.height, y + height)) - 1);
		roomValues.push(east);

		const south = { height: _.random(min, max), width: _.random(min, max) };
		south.x = _.random(x, width + x - 1);
		south.y = y + height + 1;
		south.doorx = _.random(south.x, (Math.min(south.x + south.width, x + width)) - 1);
		south.doory = y + height;
		roomValues.push(south);

		const west = { height: _.random(min, max), width: _.random(min, max) };
		west.x = x - west.width - 1;
		west.y = _.random(y, height + y - 1);
		west.doorx = x - 1;
		west.doory = _.random(west.y, (Math.min(west.y + west.height, y + height)) - 1);
		roomValues.push(west);

		const placedRooms = [];
		roomValues.forEach(room => {
			if (isValidRoomPlacement(grid, room)) {
				// place room
				grid = placeCells(grid, room);
				// place door
				grid = placeCells(grid, {x: room.doorx, y: room.doory}, 'door');
				// need placed room values for the next seeds
				placedRooms.push(room);
			}
		});
		return {grid, placedRooms};
	};

	// BUILD OUT THE MAP

	// 1. make a grid of 'empty' cells, with a random opacity value (for styling)
	let grid = [];
	for (let i = 0; i < c.GRID_HEIGHT; i++) {
		grid.push([]);
		for (let j = 0; j < c.GRID_WIDTH; j++) {
			grid[i].push({type: 0, opacity: _.random(0.3, 0.8)});
		}
	}

	// 2. random values for the first room
	const [min, max] = c.ROOM_SIZE_RANGE;
	const firstRoom = {
		x: _.random(1, c.GRID_WIDTH - max - 15),
		y: _.random(1, c.GRID_HEIGHT - max - 15),
		height: _.random(min, max),
		width: _.random(min, max)
	};

	// 3. place the first room on to grid
	grid = placeCells(grid, firstRoom);

	// 4. using the first room as a seed, recursivley add rooms to the grid
	const growMap = (grid, seedRooms, counter = 1, maxRooms = c.MAX_ROOMS) => {
		if (counter + seedRooms.length > maxRooms || !seedRooms.length) {
			return grid;
		}

		grid = createRoomsFromSeed(grid, seedRooms.pop());
		seedRooms.push(...grid.placedRooms);
		counter += grid.placedRooms.length;
		return growMap(grid.grid, seedRooms, counter);
	};
	return growMap(grid, [firstRoom]);
};
const createEntities = (gameMap, level = 1) => {
	// 1. create the entities
	const bosses = [];
	if (level === 4) {
		bosses.push({
			health: 400,
			level: 5,
			type: 'boss'
		});
	}

	const enemies = [];
	for (let i = 0; i < 7; i++) {
		enemies.push({
			health: level * 30 + 40,
			// half of the enememies will be a level higher or lower (except on
			// level 1, where ~1/4 enemies are a level higher)
			level: _.random(level, _.random(level - 1 ? level - 1 : level, level + 1)),
			type: 'enemy'
		});
	}

	const exits = [];
	if (level < 4) {
		exits.push({
			type: 'exit'
		});
	}

	const players = [
		{
			type: 'player'
		}
	];

	const potions = [];
	for (let i = 0; i < 5; i++) {
		potions.push({ type: 'potion' });
	}

	const weaponTypes = [
		{
			name: 'Laser Pistol',
			damage: 15
		},
		{
			name: 'Laser Rifle',
			damage: 19
		},
		{
			name: 'Plasma Pistol',
			damage: 26
		},
		{
			name: 'Plasma Rifle',
			damage: 28
		},
		{
			name: 'Electric ChainSaw',
			damage: 31
		},
		{
			name: 'Railgun',
			damage: 33
		},
		{
			name: 'Dark Energy Cannon',
			damage: 40
		},
		{
			name: 'B.F.G',
			damage: 43
		}
	];

	const weapons = [];
	// weapon types will vary based on the level passed to the parent function
	const qualifying = weaponTypes
		.filter(weapon => weapon.damage < level * 10 + 10)
			.filter(weapon => weapon.damage > level * 10 - 10);
	for (let i = 0; i < 3; i++) {
		const weapon = Object.assign({}, qualifying[_.random(0, qualifying.length - 1)]);
		weapon.type = 'weapon';
		weapons.push(weapon);
	}

	// 2. randomly place all the entities on to floor cells on the game map.

	// we'll need to return the players starting co-ordinates
	let playerPosition = [];
	[potions, enemies, weapons, exits, players, bosses].forEach(entities => {
		while (entities.length) {
			const x = Math.floor(Math.random() * c.GRID_WIDTH);
			const y = Math.floor(Math.random() * c.GRID_HEIGHT);
			if (gameMap[y][x].type === 'floor') {
				if (entities[0].type === 'player') {
					playerPosition = [x, y];
				}
				gameMap[y][x] = entities.pop();
			}
		}
	});

	// 3. we can now replace doors with floors
	for (let i = 0; i < gameMap.length; i++) {
		for (let j = 0; j < gameMap[0].length; j++) {
			if (gameMap[i][j].type === 'door') {
				gameMap[i][j].type = 'floor';
			}
		}
	}
	return {entities: gameMap, playerPosition};
};
///////////////////////////////////////////begin React part//////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////




let dungeon = createDungeon();

let firstStore= {
 entities: createEntities(dungeon)
}

class Dungeon extends Component {
  render() {

    let { entities,playerPosition } = this.props.entities;
    const [ playerX, playerY ] = playerPosition;

     entities.map((row, i) => row.map((cell, j) => {
      //we create a new property on each cell that measures the distance from the player

      cell.distanceFromPlayer = (Math.abs(playerY - i)) + (Math.abs(playerX - j));

      //then we will check if distance is > 10 then set opacity to 0
      if(cell.distanceFromPlayer > 10)  cell.opacity = 0;
      return cell;
    }));

      const cells= entities.map((element, index) => {
      return (
        <div className='row' key={Date.now()+index}>
        {
            element.map((cell, i) => {
              ////////////logs for better understanding the type cells//////////////
              if(cell.type == 'enemy')console.log(cell);
              else if(cell.type == 'weapon')console.log(cell);
              else if(cell.type == 'exit')console.log(cell);
              else if(cell.type == 'player')console.log(cell);
             /////////////////////////////////////////////////////////////
              return (
                <div className={
                (cell.type) ? 'cell ' + cell.type : 'cell'
                   }
                style={{opacity: cell.opacity}}
                key={i}
                 >
                </div>
              )
            })
          }
        </div>
      )
    });

    return(
      <div className='app'>
        <div className='flex-container'>
            {cells}
        </div>
      </div>

    )
  }
};


ReactDOM.render(
  <Dungeon entities={firstStore.entities}/>,
  document.getElementById("container")
);
