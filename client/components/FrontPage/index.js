
import React, { useState, useEffect, useRef } from 'react'
import MainTable from './MainTable'
import arrayEquals from '../../util/helpers'
import UISection from './UISection'
import Intro from './Intro'


class Player {
  constructor(name, id, roles, scores, deaths, duels) {
    this.name = name
    this.id = id
    this.roles = roles
    this.scores = scores
    this.deaths = deaths
    this.duels = duels
    this.totalScore = 0
  }
}

const FrontPage = () => {
  // TODO - počítat skore okamžite. Možná odstranit updaty players a přidat hook ? Nevím.
  const possibleRoles = [
    ['invalid'],
    ['invalid'],
    ['Sheriff', 'Renegade'],
    ['Sheriff', 'Renegade', 'Outlaw'],
    ['Sheriff', 'Renegade', 'Outlaw', 'Outlaw'],
    ['Sheriff', 'Renegade', 'Outlaw', 'Outlaw', 'Deputy'],
    ['Sheriff', 'Renegade', 'Outlaw', 'Outlaw', 'Deputy', 'Outlaw'],
    ['Sheriff', 'Renegade', 'Outlaw', 'Outlaw', 'Deputy', 'Outlaw', 'Deputy'],
    ['Sheriff', 'Renegade', 'Outlaw', 'Outlaw', 'Deputy', 'Outlaw', 'Deputy', 'Renegade'],
  ]
  // Dumy data
  const [players, setPlayers] = useState([
    new Player('Player_1', 1, [possibleRoles[5][0]], [0], [false], [false]),
    new Player('Player_2', 2, [possibleRoles[5][1]], [0], [false], [false]),
    new Player('Player_3', 3, [possibleRoles[5][2]], [0], [false], [false]),
    new Player('Player_4', 4, [possibleRoles[5][3]], [0], [false], [false]),
    new Player('Player_5', 5, [possibleRoles[5][4]], [0], [false], [false]),
  ])
  const [rounds, setRounds] = useState(1)
  const [endedRounds, setEndedRounds] = useState([0])
  // const [assignedRoles, setAssignedRoles] = useState([])
  const [roles, setRoles] = useState(possibleRoles[players.length])
  const [message, setMessage] = useState('')
  const [messageIsError, setMessageIsError] = useState(false)

  // MESSAGE FUNCTIONS //

  // messages clear timeout with help of: https://stackoverflow.com/questions/56597788/how-to-do-timeout-and-then-clear-timeout-in-react-functional-component
  const timerRef = useRef(null)

  const makeAndRemoveMessage = (text = '-', seconds = 3, error = false) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
    timerRef.current = setTimeout(() => {
      setMessage(null)
      setMessageIsError(false)
    }, seconds * 1000)
    setMessageIsError(error)
    setMessage(text)
    return null
  }
  // MESSAGE FUNCTIONS ENDS //


  const checkRightRolesIn = (round) => {
    const rightRoles = [...roles]
    rightRoles.sort()
    const selectedRoles = players.map((p) => p.roles[round])
    selectedRoles.sort()
    return arrayEquals(rightRoles, selectedRoles)
  }


  const computeTotalScores = (pla) => {
    // console.log('computeTotalScores called')
    const newPlayers = [...pla]
    newPlayers.forEach((p) => {
      // eslint-disable-next-line no-param-reassign
      p.totalScore = p.scores.reduce((accum, score) => accum + score, 0)
    })
    setPlayers(newPlayers)
  }

  // When adding player, we must add scores and roles to arrays
  const addPlayer = () => {
    if (players.length < 8) {
      const newRoles = []
      const newScores = []
      const newDeaths = []
      const newDuels = []
      for (let i = 0; i < rounds; i++) {
        // newRoles.push(possibleRoles[players.length + 1][players.length + 1])
        newRoles.push(possibleRoles[8][players.length])
        newScores.push(0)
        newDeaths.push(false)
        newDuels.push(false)
      }
      // console.log(newRoles)
      const name = `Player ${players.length + 1}`
      const newPlayer = new Player(name, players.length + 1, newRoles, newScores, newDeaths, newDuels)
      setRoles(possibleRoles[players.length + 1])
      computeTotalScores(players.concat(newPlayer))
      makeAndRemoveMessage('Player added !', 3, false)
    } else {
      makeAndRemoveMessage('Max number of players is 8 !', 3, true)
    }
  }

  const removePlayer = () => {
    if (players.length > 2) {
      const newPlayers = [...players]
      newPlayers.pop()
      // when player is removed a) remove one, b) chnage posible roles
      computeTotalScores(newPlayers)
      setRoles(possibleRoles[newPlayers.length])
      makeAndRemoveMessage('Player removed!', 3, false)
    } else {
      makeAndRemoveMessage('Minimal number of players is 2 !', 3, true)
    }
  }

  // when adding round also players has to be updated
  const addRound = () => {
    const newPlayers = players.map((p) => {
      const newRoles = [...p.roles]
      const newScores = [...p.scores]
      const newDeaths = [...p.deaths]
      const newDuels = [...p.duels]
      newRoles.push(possibleRoles[players.length][p.id - 1])
      newScores.push(0)
      newDeaths.push(false)
      newDuels.push(false)
      return {
        ...p,
        roles: newRoles,
        scores: newScores,
        deaths: newDeaths,
        duels: newDuels,
      }
    })
    computeTotalScores(newPlayers)
    setRounds(rounds + 1)
    makeAndRemoveMessage('Round added !', 3, false)
  }


  // remove round, update players and remove last role from them
  const removeRound = () => {
    if (rounds > 1) {
      const newPlayers = players.map((p) => {
        const newRoles = [...p.roles]
        const newDeaths = [...p.deaths]
        const newScores = [...p.scores]
        const newDuels = [...p.duels]
        newRoles.pop()
        newDeaths.pop()
        newScores.pop()
        newDuels.pop()
        return {
          ...p,
          roles: newRoles,
          deaths: newDeaths,
          scores: newScores,
          duels: newDuels,
        }
      })
      computeTotalScores(newPlayers)
      setRounds(rounds - 1)
      makeAndRemoveMessage('Round removed !', 3, false)
    } else {
      makeAndRemoveMessage('Minimal number of rounds is 1 !', 3, true)
    }
  }


  const computeScores = (r) => {
    const bandits = players.filter((p) => p.roles[r] === 'Outlaw')
    const outlawCount = players.filter((p) => p.roles[r] === 'Outlaw').length
    const playersCount = players.length
    const newPlayers = [...players]
    const renegadeHadDuels = players.filter((p) => p.roles[r] === 'Renegade' && p.duels[r] === true).length
    if (renegadeHadDuels === 2) {
      makeAndRemoveMessage(`WARRNING: Only one renegade should be in duel with sheriff in round ${r}, results may be wrong !`, 3, true)
    }
    // console.log(renegadeHadDuel)
    const n = players.length
    // if LAW wins
    const deadPlayers = players.filter((p) => p.deaths[r] === true)
    if (deadPlayers.length === players.length) {
      makeAndRemoveMessage(`WARRNING: All players are dead in round ${r}, results may be wrong !`, 3, true)
    }
    // IF LAW  wins
    if (endedRounds[r] === 2) {
      for (let i = 0; i < n; i++) {
        const role = players[i].roles[r]
        switch (role) {
          case 'Sheriff':
            if (newPlayers[i].deaths[r] === true) {
              newPlayers[i].scores[r] = 0
            } else {
              newPlayers[i].scores[r] = 1500 * outlawCount
            }
            break
          case 'Deputy':
            if (newPlayers[i].deaths[r] === true) {
              newPlayers[i].scores[r] = 700 * outlawCount
            } else {
              newPlayers[i].scores[r] = 1000 * outlawCount
            }
            break
          case 'Outlaw':
            newPlayers[i].scores[r] = 0
            break
          case 'Renegade':
            newPlayers[i].scores[r] = 0
            if (newPlayers[i].duels[r] === true) {
              newPlayers[i].scores[r] = 400 * playersCount
            }
            break
          default:
            return null
        }
      }
      computeTotalScores(newPlayers)
      // else if renegade wins
    } else if (endedRounds[r] === 1 && bandits.every((b) => b.deaths[r] === true)) {
      // console.log('else if renegade wins')
      for (let i = 0; i < n; i++) {
        const role = players[i].roles[r]
        switch (role) {
          case 'Sheriff':
            newPlayers[i].scores[r] = 100 * playersCount
            break
          case 'Deputy':
          case 'Outlaw':
            newPlayers[i].scores[r] = 0
            break
          case 'Renegade':
            if (newPlayers[i].deaths[r] === true) {
              newPlayers[i].scores[r] = 0
            } else {
              newPlayers[i].scores[r] = 1500 * playersCount
            }
            break
          default:
            return null
        }
      }
      computeTotalScores(newPlayers)
      // else if bandits wins
    } else if (endedRounds[r] === 1) {
      // console.log(' else if bandits wins')
      for (let i = 0; i < n; i++) {
        const role = players[i].roles[r]
        switch (role) {
          case 'Sheriff':
          case 'Deputy':
            newPlayers[i].scores[r] = 0
            break
          case 'Outlaw':
            if (newPlayers[i].deaths[r] === true) {
              newPlayers[i].scores[r] = 800 * outlawCount
            } else {
              newPlayers[i].scores[r] = 1000 * outlawCount
            }
            break
          case 'Renegade':
            if (newPlayers[i].deaths[r] === true) {
              newPlayers[i].scores[r] = 0
            } else {
              newPlayers[i].scores[r] = 300 * playersCount
            }
            break
          default:
            return null
        }
      }
      computeTotalScores(newPlayers)
    // else if noone wins
    } else if (endedRounds[r] === 0) {
      newPlayers.forEach((p) => {
        // eslint-disable-next-line no-param-reassign
        p.scores[r] = 0
      })
      computeTotalScores(newPlayers)
    }
    return newPlayers
  }

  const checkIfRoundsOver = () => {
    const newendedRounds = []
    // for every round do check. 0 - noone wins. 1 - law wins, 2 - renegade / outlaws wins
    for (let i = 0; i < rounds; i++) {
      const BanditsAndRenegades = players.filter((p) => p.roles[i] === 'Renegade' || p.roles[i] === 'Outlaw')

      // One liner method with .every method to get info on dead B+R
      const BanditsAndRenegadeDead = BanditsAndRenegades.every((x) => x.deaths[i])

      // old school method using for cycle to get info if sherif is dead
      let SheriffDead = false
      const n = players.length
      for (let j = 0; j < n; j++) {
        if (players[j].roles[i] === 'Sheriff' && players[j].deaths[i] === true) {
          SheriffDead = true
        }
      }

      if (SheriffDead) {
        // console.log(`Round ${i} ended`)
        newendedRounds.push(1)
      } else if (BanditsAndRenegadeDead) {
        newendedRounds.push(2)
      } else {
        // console.log(`Round ${i} continues`)
        newendedRounds.push(0)
      }
    }
    // console.log(arrayEquals(newendedRounds, endedRounds))
    setEndedRounds(newendedRounds)
    return (newendedRounds)
  }

  // function to change state of player. In his roles[] i store all roles that he played
  const changeRole = (option, playerId, round) => {
    const playerToUpdate = players.filter((pl) => pl.id === playerId)[0]
    // create new array
    const newRoles = [...playerToUpdate.roles]
    const newDuels = [...playerToUpdate.duels]
    // remove 1 element on index "round" and insert new option
    newRoles.splice(round, 1, option)
    newDuels.splice(round, 1, false)
    // console.log('NewRoles', newRoles)
    playerToUpdate.roles = newRoles
    playerToUpdate.duels = newDuels
    // If the player is the one to be changed, insert playerToUpdate, else insert old value
    const newPlayers = players.map((p) => (p.id === playerToUpdate.id ? playerToUpdate : p))
    // computeTotalScores(newPlayers)
    checkIfRoundsOver()
    return newPlayers
  }

  const makeDead = (e, playerId, round) => {
    const playerToUpdate = players.filter((pl) => pl.id === playerId)[0]
    const newDeaths = [...playerToUpdate.deaths]
    newDeaths.splice(round, 1, !newDeaths[round])
    playerToUpdate.deaths = newDeaths
    const newPlayers = players.map((p) => (p.id === playerToUpdate.id ? playerToUpdate : p))
    // computeTotalScores(newPlayers)
    checkIfRoundsOver()
    return newPlayers
  }

  const makeDuel = (e, playerId, round) => {
    const playerToUpdate = players.filter((pl) => pl.id === playerId)[0]
    const newDuels = [...playerToUpdate.duels]
    // change data in copied array
    newDuels.splice(round, 1, !newDuels[round])
    playerToUpdate.duels = newDuels
    const newPlayers = players.map((p) => (p.id === playerToUpdate.id ? playerToUpdate : p))
    // computeTotalScores(newPlayers)
    checkIfRoundsOver()
    return newPlayers
  }

  const changeName = (e, playerId) => {
    // console.log(e.target.value, playerId, 'event change')
    const playerToUpdate = players.filter((pl) => pl.id === playerId)[0]
    playerToUpdate.name = e.target.value
    setPlayers(players.map((p) => (p.id === playerToUpdate.id ? playerToUpdate : p)))
    makeAndRemoveMessage(`Name changed to ${e.target.value}`, 3, false)
  }

  const computeAllScores = () => {
    for (let i = 0; i < rounds; i++) {
      if (!checkRightRolesIn(i)) {
        makeAndRemoveMessage(`Roles in round ${i + 1} are wrongly assigned. Computed score may be wrong !`, 4, true)
      }
      computeScores([i])
    }
  }


  useEffect(() => {
    // this effect wathes endedRounds. If end is changed do computations (in reality, I also do computations when endedRound do not change, because score can be hanged for only 1 player.)
    computeAllScores()
  }, [endedRounds])


  // TODO - list of players sorted by score. Then rendered under table
  let listOfPlayers = [...players]
  listOfPlayers = listOfPlayers.sort((a, b) => b.totalScore - a.totalScore).map((p, index) => (
    <li className="list-group-item d-flex justify-content-between align-items-center font-weight-bold" key={p.id}>
      {`${index + 1}. ${p.name}`}
      <span className="badge badge-light badge-pill">{p.totalScore}</span>
    </li>
  ))

  return (
    <div className="wooden-bg-body">
      <div className=" gradient-bg-body">
        <Intro />

        <UISection
          removePlayer={removePlayer}
          addPlayer={addPlayer}
          removeRound={removeRound}
          addRound={addRound}
          rounds={rounds}
          players={players}
          message={message}
          messageIsError={messageIsError}
        />
        <MainTable
          players={players}
          roles={roles}
          rounds={rounds}
          changeRole={changeRole}
          changeName={changeName}
          makeDead={makeDead}
          makeDuel={makeDuel}
        />

        <div className="container-sm max-width-800">
          <button
            type="button"
            className="btn btn-sm btn-block btn-outline-light wooden-bg opacity-effect my-3 shadow-grey"
            onClick={() => { checkIfRoundsOver(); makeAndRemoveMessage('Checked!', 2, false) }}
          >
            <span className="western-font black-text text-center">Check manualy</span>
          </button>
          <div className="py-3 pb-5 py-md-5">
            <h5 className="mt-3 py-3 text-center">All players by score:</h5>
            <ul className="list-group mx-md-3 mx-lg-5">
              {listOfPlayers}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FrontPage
