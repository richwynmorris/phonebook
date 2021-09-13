require('dotenv').config()
const express = require('express')
const app = express()
const cors = require('cors')
const morgan = require('morgan')
const Person = require('./models/person.js')

app.use(morgan('dev'))
app.use(express.json())
app.use(cors())
app.use(express.static('build'))

app.get('/api/persons', (request, response) => {
  Person.find({}).then(persons => {
    response.json(persons)
  })
})

app.get('/info', (request, response) => {
  let currentTime = new Date()
  let countInfo = 'sent already'
  let timeStamp = `<p>${currentTime}</p>`

  Person.find({}).then(persons => {
    countInfo = `<p>Phonebook had info for ${persons.length} people</p>`
    response.send(countInfo + timeStamp)
  })
})

app.get('/api/persons/:id', (request, response, next) => {
  Person.findById(request.params.id)
    .then(person => {
      if (person) {
        response.json(person)
      } else {
        response.send(404).end()
      }
    })
    .catch(error => next(error))
})

app.delete('/api/persons/:id', (request, response, next) => {
  Person.findByIdAndRemove(request.params.id)
    .then(request => {
      response.status(204).end()
    })
    .catch(error => next(error))
})

app.post('/api/persons', (request, response, next) => {
  const body = request.body

  if (!body.name || !body.number) {
    return response.status(404).json({
      error: 'name or number missing'
    })
  }

  const contact = new Person({
    name: body.name,
    number: body.number,
  })

  contact.save()
    .then(savedContact => response.json(savedContact))
    .catch(error => next(error))
})

app.put('/api/persons/:id', (request, response, next) => {
  const body = request.body

  const person = {
    name: body.name,
    number: body.number
  }

  Person.findByIdAndUpdate(request.params.id, person, { new:true })
    .then(updatedPerson => {
      response.json(updatedPerson)
    })
    .catch(error => next(error))
})

const unknownEndpoint = (request, response) => {
  response.status(404).send({
    error: 'unknown endpoint'
  })
}

app.use(unknownEndpoint)

const errorHandler = (err, req, resp, next) => {
  console.error(err.message)

  if (err.name === 'CastError') {
    return resp.status(404).send({ error: 'Malformed id' })
  } else if (err.name === 'ValidationError') {
    return resp.status(400).send({ error: err.message })
  }

  next(err)
}

app.use(errorHandler)

const PORT = process.env.PORT || PORT

app.listen(PORT, () => {
  console.log(`server running on port ${PORT}`)
})