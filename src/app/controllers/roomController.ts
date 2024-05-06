// Node.js built-in modules

// Third-party libraries
import { type NextFunction, type Request, type Response } from 'express'
import mongoose from 'mongoose'

// Own modules
import logger from '../utils/logger.js'
import RoomModel from '../models/Room.js'

export async function createRoom (req: Request, res: Response, next: NextFunction): Promise<void> {
	logger.silly('Creating room')

	try {
		const newRoom = await RoomModel.create(req.body as Record<string, unknown>)
		res.status(201).json(newRoom)
	} catch (error) {
		if (error instanceof mongoose.Error.ValidationError) {
			res.status(400).json({ error: error.message })
		} else {
			next(error)
		}
	}
}

export async function getRoom (req: Request, res: Response, next: NextFunction): Promise<void> {
	logger.silly('Getting room')

	try {
		const room = await RoomModel.findById(req.params.id)

		if (room === null || room === undefined) {
			res.status(404).json({ error: 'Rum ikke fundet' })
			return
		}

		res.status(200).json(room)
	} catch (error) {
		if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
			res.status(400).json({ error: error.message })
		} else {
			next(error)
		}
	}
}

export async function getRooms (req: Request, res: Response, next: NextFunction): Promise<void> {
	logger.silly('Getting rooms')

	try {
		const rooms = await RoomModel.find({})
		res.status(200).json(rooms)
	} catch (error) {
		if (error instanceof mongoose.Error.ValidationError) {
			res.status(400).json({ error: error.message })
		} else {
			next(error)
		}
	}
}

export async function patchRoom (req: Request, res: Response, next: NextFunction): Promise<void> {
	logger.silly('Patching room')

	try {
		const room = await RoomModel.findByIdAndUpdate(req.params.id, req.body as Record<string, unknown>, {
			new: true,
			runValidators: true
		})

		if (room === null || room === undefined) {
			res.status(404).json({ error: 'Rum ikke fundet' })
			return
		}

		res.status(200).json(room)
	} catch (error) {
		if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
			res.status(400).json({ error: error.message })
		} else {
			next(error)
		}
	}
}

export async function deleteRoom (req: Request, res: Response, next: NextFunction): Promise<void> {
	logger.silly('Deleting room')

	if (req.body.confirm === undefined || req.body.confirm === null || typeof req.body.confirm !== 'boolean' || req.body.confirm !== true) {
		res.status(400).json({ error: 'Kræver konfirmering' })
		return
	}

	try {
		const room = await RoomModel.findByIdAndDelete(req.params.id)

		if (room === null || room === undefined) {
			res.status(404).json({ error: 'Rum ikke fundet' })
			return
		}

		res.status(204).send()
	} catch (error) {
		if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
			res.status(400).json({ error: error.message })
		} else {
			next(error)
		}
	}
}
