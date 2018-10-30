import express from 'express'
import graphqlHTTP from 'express-graphql'
import MyGraphQLSchema from './schema.js'

const app = express()

app.use(
    '/graphql',
    graphqlHTTP({
        schema: MyGraphQLSchema,
        graphiql: true
    })
)

app.listen(4000, () => {
    console.log('listening on port 4000...')
})
