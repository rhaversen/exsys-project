// Node.js built-in modules

// Third-party libraries
import { type Document, model, Schema, type Types } from 'mongoose'

// Own modules
import logger from '../utils/logger.js'
import OptionModel from './Option.js'
import ProductModel from './Product.js'
import RoomModel from './Room.js'

// Destructuring and global variables

// Interfaces
export interface IOrder extends Document {
	_id: Types.ObjectId
	requestedDeliveryDate: Date // The date the order is supposed to be delivered
	roomId: Types.ObjectId // Reference to the Room document
	products: Array<{
		productId: Types.ObjectId
		quantity: number
	}> // The products and their quantities
	options?: Array<{
		optionId: Types.ObjectId
		quantity: number
	}> // Additional options for the order
}

// Sub-schema for products
const productsSubSchema = new Schema({
	productId: {
		type: Schema.Types.ObjectId,
		ref: 'Product',
		required: [true, 'Produkt er påkrevet']
	},
	quantity: {
		type: Schema.Types.Number,
		required: [true, 'Mængde er påkrevet'],
		min: [1, 'Mængde skal være større end 0']
	}
})

// Sub-schema for options
const optionsSubSchema = new Schema({
	optionId: {
		type: Schema.Types.ObjectId,
		ref: 'Option',
		required: [true, 'Tilvalg er påkrevet']
	},
	quantity: {
		type: Schema.Types.Number,
		required: [true, 'Mængde er påkrevet'],
		min: [1, 'Mængde skal være større end 0']
	}
})

// Main order schema
const orderSchema = new Schema({
	requestedDeliveryDate: {
		type: Schema.Types.Date,
		required: [true, 'Leveringstidspunkt er påkrevet']
	},
	roomId: {
		type: Schema.Types.ObjectId,
		ref: 'Room',
		required: [true, 'Rum er påkrevet']
	},
	products: {
		type: [productsSubSchema],
		required: [true, 'Produkter er påkrævet'],
		unique: true
	},
	options: {
		type: [optionsSubSchema],
		unique: true,
		default: undefined
	}
}, {
	timestamps: true
})

// Validations
orderSchema.path('requestedDeliveryDate').validate(function (v: Date) {
	return v >= new Date()
}, 'Leveringstidspunkt skal være i fremtiden')

orderSchema.path('requestedDeliveryDate').validate(function (v: Date) {
	const currentDate = new Date().setUTCHours(0, 0, 0, 0)
	const requestedDeliveryDate = new Date(v).setUTCHours(0, 0, 0, 0)
	return currentDate === requestedDeliveryDate
}, 'Leveringstidspunkt skal være i dag')

orderSchema.path('roomId').validate(async function (v: Types.ObjectId) {
	const room = await RoomModel.findById(v)
	return room !== null && room !== undefined
}, 'Rummet eksisterer ikke')

orderSchema.path('products').validate(function (v: Array<{ productId: Types.ObjectId, quantity: number }>) {
	const unique = new Set(v.map(v => v.productId.id))
	return unique.size === v.length
}, 'Produkterne skal være unikke')

orderSchema.path('products').validate(function (v: Array<{ productId: Types.ObjectId, quantity: number }>) {
	return v.length > 0
}, 'Mindst et produkt er påkrævet')

orderSchema.path('products').validate(async function (v: Array<{ productId: Types.ObjectId, quantity: number }>) {
	for (const product of v) {
		const productModel = await ProductModel.findOne({ _id: product.productId })
		if (productModel === null || productModel === undefined) {
			return false
		}

		const availability = productModel.availability

		if (product.quantity > availability) {
			return false
		}
	}

	return true
}, 'Kan ikke bestille flere produkter end der er til rådighed')

orderSchema.path('products').validate(async function (v: Array<{ productId: Types.ObjectId, quantity: number }>) {
	for (const product of v) {
		const productModel = await ProductModel.findOne({ _id: product.productId })

		if (productModel === null || productModel === undefined) {
			return false
		}

		const maxOrderQuantity = productModel.maxOrderQuantity

		if (product.quantity > maxOrderQuantity) {
			return false
		}
	}

	return true
}, 'Kan ikke bestille så mange produkter på en gang')

orderSchema.path('products.productId').validate(async function (v: Types.ObjectId) {
	const product = await ProductModel.findById(v)
	return product !== null && product !== undefined
}, 'Produktet eksisterer ikke')

orderSchema.path('products.productId').validate(async function (v: Types.ObjectId) {
	const product = await ProductModel.findById(v)

	if (product === null || product === undefined) {
		return false
	}

	const now = new Date()
	const nowHour = now.getUTCHours()
	const nowMinute = now.getUTCMinutes()

	const from = product.orderWindow.from
	const to = product.orderWindow.to

	const isWithinHour = from.hour < nowHour && nowHour < to.hour
	const isStartHour = nowHour === from.hour && nowMinute >= from.minute
	const isEndHour = nowHour === to.hour && nowMinute <= to.minute

	return isWithinHour || isStartHour || isEndHour
}, 'Bestillingen er uden for bestillingsvinduet')

orderSchema.path('products.quantity').validate(function (v: number) {
	return Number.isInteger(v)
}, 'Produkt mængde skal være et heltal')

orderSchema.path('options').validate(function (v: Array<{ optionId: Types.ObjectId, quantity: number }>) {
	const unique = new Set(v.map(v => v.optionId.id))
	return unique.size === v.length
}, 'Tilvalgene skal være unikke')

orderSchema.path('options.optionId').validate(async function (v: Types.ObjectId) {
	const option = await OptionModel.findById(v)
	return option !== null && option !== undefined
}, 'Tilvalget eksisterer ikke')

orderSchema.path('options.quantity').validate(function (v: number) {
	return Number.isInteger(v)
}, 'Tilvalg mængde skal være et heltal')

orderSchema.path('options').validate(async function (v: Array<{ optionId: Types.ObjectId, quantity: number }>) {
	for (const option of v) {
		const optionModel = await OptionModel.findById(option.optionId)

		if (optionModel === null || optionModel === undefined) {
			return false
		}

		const availability = optionModel.availability

		if (option.quantity > availability) {
			return false
		}
	}

	return true
}, 'Kan ikke bestille flere tilvalg end der er til rådighed')

orderSchema.path('options').validate(async function (v: Array<{ optionId: Types.ObjectId, quantity: number }>) {
	for (const option of v) {
		const optionModel = await OptionModel.findById(option.optionId)

		if (optionModel === null || optionModel === undefined) {
			return false
		}

		const maxOrderQuantity = optionModel.maxOrderQuantity

		if (option.quantity > maxOrderQuantity) {
			return false
		}
	}

	return true
}, 'Kan ikke bestille så mange tilvalg på en gang')

// Adding indexes
orderSchema.index({ requestedDeliveryDate: -1 })

// Pre-save middleware
orderSchema.pre('save', function (next) {
	logger.silly('Saving order')
	next()
})

// Compile the schema into a model
const OrderModel = model<IOrder>('Order', orderSchema)

// Export the model
export default OrderModel
