import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Example endpoint to get all vessels
router.get('/vessels', async (req, res) => {
    try {
        const vessels = await prisma.vessel.findMany();
        res.json(vessels);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch vessels' });
    }
});

// Example endpoint to create a new vessel
router.post('/vessels', async (req, res) => {
    const { name, type } = req.body;
    try {
        const newVessel = await prisma.vessel.create({
            data: {
                name,
                type,
            },
        });
        res.status(201).json(newVessel);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create vessel' });
    }
});

// Add more API endpoints as needed

export default router;