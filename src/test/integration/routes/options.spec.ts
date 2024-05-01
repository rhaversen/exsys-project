// Node.js built-in modules

// Third-party libraries
import { expect } from 'chai'
import { describe, it } from 'mocha'
import mongoose from 'mongoose'
import { chaiAppServer as agent } from '../../testSetup.js'

// Own modules
import OptionModel, { type IOption } from '../../../app/models/Option.js'

describe('POST /v1/options', function () {
	const testOptionFields1 = {
		name: 'Option 1',
		description: 'Description for Option 1',
		price: 10
	}

	it('should create a new option', async function () {
		await agent.post('/v1/options').send(testOptionFields1)

		const option = await OptionModel.findOne({})
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(option).to.exist
		expect(option).to.have.property('name', testOptionFields1.name)
		expect(option).to.have.property('description', testOptionFields1.description)
		expect(option).to.have.property('price', testOptionFields1.price)
	})

	it('should return the newly created object', async function () {
		const response = await agent.post('/v1/options').send(testOptionFields1)

		expect(response).to.have.status(201)
		expect(response.body).to.have.property('name', testOptionFields1.name)
		expect(response.body).to.have.property('description', testOptionFields1.description)
		expect(response.body).to.have.property('price', testOptionFields1.price)
	})
})

describe('GET /v1/options', function () {
	const testOptionFields1 = {
		name: 'Option 1',
		description: 'Description for Option 1',
		price: 10
	}

	const testOptionFields2 = {
		name: 'Option 2',
		description: 'Description for Option 2',
		price: 20
	}

	beforeEach(async function () {
		await OptionModel.create(testOptionFields1)
		await OptionModel.create(testOptionFields2)
	})

	it('should return all options', async function () {
		const response = await agent.get('/v1/options')

		expect(response).to.have.status(200)
		expect(response.body).to.be.an('array')
		expect(response.body).to.have.length(2)
		expect(response.body[0]).to.have.property('name', testOptionFields1.name)
		expect(response.body[0]).to.have.property('description', testOptionFields1.description)
		expect(response.body[0]).to.have.property('price', testOptionFields1.price)
		expect(response.body[1]).to.have.property('name', testOptionFields2.name)
		expect(response.body[1]).to.have.property('description', testOptionFields2.description)
		expect(response.body[1]).to.have.property('price', testOptionFields2.price)
	})

	it('should return an empty array if no options exist', async function () {
		await OptionModel.deleteMany({})

		const response = await agent.get('/v1/options')

		expect(response).to.have.status(200)
		expect(response.body).to.be.an('array')
		expect(response.body).to.have.length(0)
	})
})

describe('PATCH /v1/options/:id', function () {
	let testOption1: IOption

	const testOptionFields1 = {
		name: 'Option 1',
		description: 'Description for Option 1',
		price: 10
	}

	const testOptionFields2 = {
		name: 'Option 2',
		description: 'Description for Option 2',
		price: 20
	}

	beforeEach(async function () {
		testOption1 = await OptionModel.create(testOptionFields1)
		await OptionModel.create(testOptionFields2)
	})

	it('should update an option', async function () {
		const updatedFields = {
			name: 'Updated Option 1',
			description: 'Updated Description for Option 1',
			price: 15
		}

		const response = await agent.patch(`/v1/options/${testOption1.id}`).send(updatedFields)

		expect(response).to.have.status(200)
		expect(response.body).to.have.property('name', updatedFields.name)
		expect(response.body).to.have.property('description', updatedFields.description)
		expect(response.body).to.have.property('price', updatedFields.price)
	})

	it('should return 404 if the option does not exist', async function () {
		const updatedFields = {
			name: 'Updated Option 1',
			description: 'Updated Description for Option 1',
			price: 15
		}

		const response = await agent.patch(`/v1/options/${new mongoose.Types.ObjectId().toString()}`).send(updatedFields)

		expect(response).to.have.status(404)
		expect(response.body).to.have.property('error', 'Tilvalg ikke fundet')
	})

	it('should return an error if the request is invalid', async function () {
		const updatedFields = {
			name: 'Updated Option 1',
			description: 'Updated Description for Option 1',
			price: -15
		}

		const response = await agent.patch(`/v1/options/${testOption1.id}`).send(updatedFields)

		expect(response).to.have.status(400)
		expect(response.body).to.have.property('error')
	})
})

describe('DELETE /v1/options/:id', function () {
	let testOption1: IOption

	const testOptionFields1 = {
		name: 'Option 1',
		description: 'Description for Option 1',
		price: 10
	}

	const testOptionFields2 = {
		name: 'Option 2',
		description: 'Description for Option 2',
		price: 20
	}

	beforeEach(async function () {
		testOption1 = await OptionModel.create(testOptionFields1)
		await OptionModel.create(testOptionFields2)
	})

	it('should delete an option', async function () {
		const response = await agent.delete(`/v1/options/${testOption1.id}`).send({ confirm: true })

		expect(response).to.have.status(204)
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(response.body).to.be.empty
		const product = await OptionModel.findById(testOption1.id)
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(product).to.not.exist
	})

	it('should return 404 if the option does not exist', async function () {
		const response = await agent.delete(`/v1/options/${new mongoose.Types.ObjectId().toString()}`).send({ confirm: true })

		expect(response).to.have.status(404)
		expect(response.body).to.have.property('error', 'Tilvalg ikke fundet')
	})

	it('should return an error if confirm false', async function () {
		const response = await agent.delete(`/v1/options/${testOption1.id}`).send({ confirm: false })

		expect(response).to.have.status(400)
		expect(response.body).to.have.property('error', 'Kræver konfirmering')
	})

	it('should return an error if confirm is not a boolean', async function () {
		const response = await agent.delete(`/v1/options/${testOption1.id}`).send({ confirm: 'true' })

		expect(response).to.have.status(400)
		expect(response.body).to.have.property('error', 'Kræver konfirmering')
	})

	it('should return an error if confirm is not present', async function () {
		const response = await agent.delete(`/v1/options/${testOption1.id}`)

		expect(response).to.have.status(400)
		expect(response.body).to.have.property('error', 'Kræver konfirmering')
	})
})
