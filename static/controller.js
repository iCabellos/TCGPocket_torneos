let players = [];
let scores = {};
let history = [];
let round = 0;
let tournamentId = 0;
let matchHistory = {};

function loadPlayers() {
    players = JSON.parse(localStorage.getItem('players')) || [];
    scores = JSON.parse(localStorage.getItem('scores')) || {};
    history = JSON.parse(localStorage.getItem('history')) || [];
    round = parseInt(localStorage.getItem('round')) || 0;
    tournamentId = parseInt(localStorage.getItem('tournamentId')) || 0;

    if (Object.keys(scores).length === 0) {
        players.forEach(player => {
            scores[player.name] = 0;
        });
        localStorage.setItem('scores', JSON.stringify(scores));
    }

    updatePlayerList();
    updateHistory();
    updatePlayerStats();
}

function registerPlayer() {
    const playerName = document.getElementById('playerName').value.trim();
    const playerCombo = document.getElementById('playerCombo').value.trim();

    if (playerName && playerCombo) {
        if (!scores[playerName]) {
            players.push({ name: playerName, combo: playerCombo, tournamentsWon: 0 });
            scores[playerName] = 0;

            localStorage.setItem('players', JSON.stringify(players));
            localStorage.setItem('scores', JSON.stringify(scores));

            document.getElementById('playerName').value = '';
            document.getElementById('playerCombo').value = '';
            updatePlayerList();
        } else {
            alert('El jugador ya existe.');
        }
    } else {
        alert('Por favor, complete todos los campos.');
    }
}

function updatePlayerList() {
    const playersList = document.getElementById('players');

    if (!playersList) {
        console.warn('Elemento de la lista de jugadores no encontrado en el DOM.');
        return;
    }

    playersList.innerHTML = '';
    players.forEach(player => {
        const li = document.createElement('li');
        li.textContent = `${player.name} - pts: ${scores[player.name]} - ${player.combo}`;
        playersList.appendChild(li);
    });
}

function updatePlayerStats() {
    const statsList = document.getElementById('statsList');

    if (!statsList) {
        console.warn('Elemento de estadísticas no encontrado en el DOM.');
        return;
    }

    statsList.innerHTML = ''; // Limpiar la lista de estadísticas

    // Filtrar los jugadores que han ganado al menos un torneo
    const playersWithWins = players.filter(player => player.tournamentsWon > 0);

    // Mostrar solo los jugadores que han ganado al menos un torneo
    playersWithWins.forEach(player => {
        const li = document.createElement('li');
        li.textContent = `${player.name} (Combo: ${player.combo}) - Torneos ganados: ${player.tournamentsWon}`;
        statsList.appendChild(li);
    });
}

function generateMatchCode() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let code = '';
    for (let i = 0; i < 5; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        code += characters[randomIndex];
    }
    return code;
}

function startTournament() {
    if (players.length < 2) {
        alert('Se necesitan al menos 2 jugadores para iniciar el torneo.');
        return;
    }

    // Reinicia puntajes y el historial de enfrentamientos
    scores = {};
    matchHistory = {};

    players.forEach(player => {
        scores[player.name] = 0;
        matchHistory[player.name] = [];
    });

    localStorage.setItem('scores', JSON.stringify(scores));
    localStorage.setItem('matchHistory', JSON.stringify(matchHistory));

    tournamentId++;
    localStorage.setItem('tournamentId', tournamentId);

    document.getElementById('bracket').classList.remove('hidden');

    round = 1;
    const totalRounds = Math.ceil(Math.log2(players.length));
    localStorage.setItem('round', round);
    localStorage.setItem('totalRounds', totalRounds);

    displayMatches();
}

function displayMatches() {
    const bracketContent = document.getElementById('bracketContent');

    if (!bracketContent) {
        console.error('Elemento del contenido del bracket no encontrado en el DOM.');
        return;
    }

    bracketContent.innerHTML = `<h3>Ronda ${round}</h3>`;

    players.sort((a, b) => scores[b.name] - scores[a.name]);
    let unmatchedPlayers = [...players];
    let matchCount = 1;

    while (unmatchedPlayers.length > 1) {
        let player1 = unmatchedPlayers.shift();
        let opponentIndex = unmatchedPlayers.findIndex(
            player => !matchHistory[player1.name].includes(player.name)
        );

        let player2 = opponentIndex !== -1
            ? unmatchedPlayers.splice(opponentIndex, 1)[0]
            : { name: 'Bye' };

        if (player2.name !== 'Bye') {
            matchHistory[player1.name].push(player2.name);
            matchHistory[player2.name].push(player1.name);
        }

        const matchCode = generateMatchCode();
        const match = document.createElement('div');
        match.innerHTML = `
            <div class="match">
                <strong>Partido ${matchCount}:</strong> ${player1.name} vs ${player2.name}
                <br>Código: <strong>${matchCode}</strong>
                <br>
                <label for="winner-${player1.name}-${player2.name}">Selecciona el ganador:</label>
                <select id="winner-${player1.name}-${player2.name}">
                    ${player1.name !== 'Bye' ? `<option value="${player1.name}">${player1.name}</option>` : ''}
                    ${player2.name !== 'Bye' ? `<option value="${player2.name}">${player2.name}</option>` : ''}
                </select>
            </div>
        `;
        bracketContent.appendChild(match);
        matchCount++;
    }

    if (unmatchedPlayers.length === 1) {
        const byePlayer = unmatchedPlayers[0];
        const byeMessage = document.createElement('div');
        byeMessage.innerHTML = `<p>${byePlayer.name} descansa esta ronda.</p>`;
        bracketContent.appendChild(byeMessage);
    }
}

function endRound() {
    const bracketContent = document.getElementById('bracketContent');

    if (!bracketContent) {
        console.error('Elemento del contenido del bracket no encontrado en el DOM.');
        return;
    }

    const selects = Array.from(bracketContent.querySelectorAll('select'));
    let roundResults = [];
    let winners = [];

    selects.forEach(select => {
        const winner = select.value;
        if (winner) {
            scores[winner] += 3; // Sumar puntos al ganador
            roundResults.push(`${winner} gana +3 puntos`);
            winners.push(winner); // Guardar el ganador
        }
    });

    // Agregar el log de la ronda al historial de ese torneo
    history.unshift({
        tournamentId: tournamentId,
        round: round,
        log: roundResults.join(', '),
        winners: winners,  // Los ganadores de esa ronda
    });

    round++;
    localStorage.setItem('scores', JSON.stringify(scores));
    localStorage.setItem('history', JSON.stringify(history));
    localStorage.setItem('round', round);

    updatePlayerList();
    updateHistory();
    updatePlayerStats();

    const totalRounds = parseInt(localStorage.getItem('totalRounds'));
    if (round > totalRounds) {
        declareWinner();
    } else {
        displayMatches();
    }
}

function declareWinner() {
    const winner = Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b);

    players.forEach(player => {
        if (player.name === winner) {
            player.tournamentsWon++;
        }
    });

    localStorage.setItem('players', JSON.stringify(players));

    // Crear una nueva card con el ganador y los combates
    const winnerCard = document.getElementById('lastWinnerCard');
    winnerCard.classList.remove('hidden'); // Aseguramos que la card sea visible

    // Limpiar cualquier contenido previo
    const logsWinner = document.getElementById('logsWinner');
    logsWinner.innerHTML = '';

    // Mostrar el ganador
    const winnerItem = document.createElement('li');
    winnerItem.textContent = `${winner} ha ganado el torneo con ${scores[winner]} puntos.`;

    // Añadir el log del ganador
    logsWinner.appendChild(winnerItem);

    // Mostrar los combates del ganador
    players
        .filter(player => player.name === winner)
        .forEach(player => {
            const matches = matchHistory[player.name] || [];
            const matchItems = matches.map(opponent => `<li>${player.name} vs ${opponent}</li>`).join('');
            const matchList = document.createElement('ul');
            matchList.innerHTML = matchItems;
            logsWinner.appendChild(matchList);
        });

    updatePlayerStats();
    document.getElementById('bracket').classList.add('hidden');
}


function updateHistory() {
    const historyList = document.getElementById('historyList');
    const historyCard = document.getElementById('history');

    if (!historyList || !historyCard) {
        console.warn('Elementos para el historial no encontrados en el DOM.');
        return;
    }

    historyList.innerHTML = '';

    history.forEach(event => {
        const card = document.createElement('div');
        card.classList.add('history-card');
        card.innerHTML = `
            <h4>Torneo ${event.tournamentId} - Ronda ${event.round}</h4>
            <p>${event.log}</p>
            <div>
                ${event.winners.map((winner, index) => `
                    <div>
                        <label for="winner-edit-${event.tournamentId}-${index}">Edita el ganador ${index + 1}:</label>
                        <input type="text" id="winner-edit-${event.tournamentId}-${index}" value="${winner}" class="form-control" />
                    </div>
                `).join('')}
            </div>
            <button class="btn btn-sm btn-primary mt-2" onclick="saveHistory(${event.tournamentId})">Guardar</button>
        `;

        historyList.appendChild(card);
    });

    historyCard.classList.remove('hidden');
}

function saveHistory(tournamentId) {
    const eventIndex = history.findIndex(event => event.tournamentId === tournamentId);
    if (eventIndex > -1) {
        const updatedWinners = history[eventIndex].winners.map((_, index) => {
            return document.getElementById(`winner-edit-${tournamentId}-${index}`).value;
        });

        // Actualizar los ganadores y los puntos
        updatedWinners.forEach(winner => {
            scores[winner] += 3; // Actualizar los puntos del ganador
        });

        // Actualizar el log con los nuevos ganadores
        history[eventIndex].winners = updatedWinners;
        history[eventIndex].log = updatedWinners.map(winner => `${winner} gana +3 puntos`).join(', ');

        // Guardar los cambios
        localStorage.setItem('history', JSON.stringify(history));
        localStorage.setItem('scores', JSON.stringify(scores));

        updateHistory();
        updatePlayerStats();
    }
}

function checkWinnerVisibility() {
    const winnerCard = document.getElementById('lastWinnerCard');

    // Comprobar si hay un ganador registrado en el localStorage
    const players = JSON.parse(localStorage.getItem('players')) || [];
    const lastWinner = players.find(player => player.tournamentsWon > 0);

    // Si no hay ganador, ocultamos el div; si hay, lo mostramos
    if (!lastWinner) {
        winnerCard.classList.add('hidden');
    } else {
        winnerCard.classList.remove('hidden');
    }
}

window.onload = function() {
    loadPlayers();
    checkWinnerVisibility();
};
