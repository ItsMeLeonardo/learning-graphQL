import { gql, ApolloServer, UserInputError } from "apollo-server";
import axios from "axios";
import { v1 as uuid } from "uuid";

const BASE_URL = "http://localhost:3000/persons";

const persons = [
  {
    name: "John",
    lastName: "Doe",
    age: 20,
    phone: "555-555-5555",
    city: "New York",
    street: "123 Main Street",
    id: 1,
  },
  {
    name: "Jane",
    lastName: "Mike",
    age: 21,
    phone: "11-11-2111",
    city: "Lima",
    street: "321 South Street",
    id: 2,
  },
  {
    name: "Anna",
    lastName: "Smith",
    age: 22,
    city: "Miami",
    street: "456 North Street",
    id: 3,
  },
  {
    name: "Peter",
    lastName: "Parker",
    age: 13,
    phone: "333-333-3333",
    city: "New York",
    street: "789 South Street",
    id: 4,
  },
];

const typeDefs = gql`
  enum YesNo {
    YES
    NO
  }
  type Address {
    city: String!
    street: String!
  }

  type Person {
    id: ID!
    name: String!
    lastName: String!
    fullName: String!
    age: Int!
    phone: String
    isAdult: Boolean!
    address: Address!
  }

  type Query {
    personsCount: Int!
    allPersons(phone: YesNo): [Person]!
    findPerson(name: String!): Person
  }

  type Mutation {
    createPerson(
      name: String!
      lastName: String!
      age: Int!
      phone: String
      city: String!
      street: String!
    ): Person

    editPhoneNumber(name: String!, phone: String!): Person
  }
`;

const resolvers = {
  Query: {
    personsCount: async () => {
      const { data } = await axios.get(BASE_URL);
      return data.length;
    },
    allPersons: async (root, args) => {
      const { data: personsFromApi } = await axios.get(BASE_URL);
      if (!args.phone) return personsFromApi;
      const byPhone = personsFromApi.filter((person) =>
        args.phone === "YES" ? person.phone : !person.phone
      );
      return byPhone;
    },
    findPerson: async (root, args) => {
      const { name } = args;
      const { data: personsFromApi } = await axios.get(BASE_URL);
      return personsFromApi.find(
        (person) => person.name.toLowerCase() === name.toLowerCase()
      );
    },
  },
  Mutation: {
    createPerson: async (root, args) => {
      const { data: personsFromApi } = await axios.get(BASE_URL);
      if (personsFromApi.find((person) => person.name === args.name)) {
        throw new UserInputError("Person already exists", {
          invalidArgs: args.name,
        });
      }
      const person = { ...args, id: uuid() };
      personsFromApi.push(person);
      return person;
    },
    editPhoneNumber: (root, args) => {
      const { name, phone } = args;
      const personIndex = persons.findIndex(
        (p) => p.name.toLowerCase() === name.toLowerCase()
      );

      if (personIndex === -1) return null;

      const person = persons.at(personIndex);
      const updatedPerson = { ...person, phone };
      persons[personIndex] = updatedPerson;

      return updatedPerson;
    },
  },
  Person: {
    fullName: (root) => `${root.name} ${root.lastName}`,
    isAdult: (root) => root.age >= 18,
    address: (root) => {
      return {
        city: root.city,
        street: root.street,
      };
    },
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

server.listen().then(({ url }) => {
  console.log(`🚀  Server ready at ${url}`);
});
