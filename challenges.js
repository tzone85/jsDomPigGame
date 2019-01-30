/*
GAME CHALLENGES

1. A player loses his ENTIRE core when he rolls two 6 in a row. THen it's the next players turn. (hint: save previous dice roll in a separate variable)
2. Add an input field to the HTML where players can set the winning score, so that they can change the predefined score of say 100.(Hint: you can read that value with teh .value property in Js. Use google)
3. Add another dice to the game, so that there are two dices now. The player looses his current score when one of them is a 1. (Hint: you will need css to position the second dice, so look at the css code for the first )
*/

var scores, roundScore, activePlayer, gamePlaying, lastDice;

init();

document.querySelector('.btn-roll').addEventListener('click', function(){
    if (gamePlaying){
        // 1. Random number
        var dice = Math.floor(Math.random() * 6) + 1;

        // 2. Display the result
        var diceDOM = document.querySelector('.dice');
        diceDOM.style.display = 'block';
        diceDOM.src = 'dice-' + dice + '.png';
        
        // 3. Update the round score if the rolled number was not a 1
        if (dice === 6 && lastDice === 6){
            // player loses score
            scores[activePlayer] = 0;
            document.querySelector('#score-' + activePlayer).textContent = scores[activePlayer];
            nextPlayer();
        } else if (dice !== 1) {
            // add score
            roundScore += dice;
            document.querySelector('#current-'+ activePlayer).textContent = roundScore;
        } else {
            // next player
            nextPlayer();
        }

        lastDice = dice;
    }
});  // the btn is called by the event listenner hence called a callback function

document.querySelector('.btn-hold').addEventListener('click', function(){
    if (gamePlaying){
        // when hold button is pressed, add current score to global score
        scores[activePlayer] += roundScore;

        // update the UI
        document.querySelector('#score-' + activePlayer).textContent = scores[activePlayer];

        // check if player won the game
        if (scores[activePlayer] >= 20){
                document.querySelector('#name-'+ activePlayer).textContent = 'Winner!';
                document.querySelector('.dice').style.display = 'none';
                document.querySelector('.player-' + activePlayer + '-panel').classList.add('winner');
                document.querySelector('.player-' + activePlayer + '-panel').classList.remove('winner');
                gamePlaying = false;
            } else {
                nextPlayer();
            }
    }
});

function nextPlayer(){
    // next player
    activePlayer === 0 ? activePlayer = 1 : activePlayer = 0;
    roundScore = 0;

    document.getElementById('current-0').textContent = '0';
    document.getElementById('current-1').textContent = '0';

    document.querySelector('.player-0-panel').classList.toggle('active');
    document.querySelector('.player-1-panel').classList.toggle('active');

    document.querySelector('.dice').style.display = 'none';

    // changing the active class to the player that is actually playing consecutively
    // document.querySelector('.player-0-panel').classList.remove('active');
    // document.querySelector('.player-1-panel').classList.add('active');
} 
// an unnonimous function cannot be re-used, it's created and used on the fly so to speak.

// reset the game to the initial state
document.querySelector('.btn-new').addEventListener('click', init);

function init(){
    scores = [0, 0];
    roundScore = 0;
    activePlayer = 0;
    gamePlaying = true;

    document.querySelector('.dice').style.display = 'none';

    document.getElementById('score-0').textContent = '0';
    document.getElementById('score-1').textContent = '0';
    document.getElementById('current-0').textContent = '0';
    document.getElementById('current-1').textContent = '0';
    document.getElementById('name-0').textContent = 'Player 1';
    document.getElementById('name-1').textContent = 'Player 2';

    document.querySelector('.player-0-panel').classList.remove('winner');
    document.querySelector('.player-1-panel').classList.remove('winner');
    document.querySelector('.player-0-panel').classList.remove('active');
    document.querySelector('.player-1-panel').classList.remove('active');    
    
    document.querySelector('.player-0-panel').classList.add('active');
}