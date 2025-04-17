import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getAllVessels = async () => {
    return await prisma.vessel.findMany();
};

export const getVesselById = async (id: number) => {
    return await prisma.vessel.findUnique({
        where: { id },
    });
};

export const createVessel = async (data: { name: string; type: string; length: number; }) => {
    return await prisma.vessel.create({
        data,
    });
};

export const updateVessel = async (id: number, data: { name?: string; type?: string; length?: number; }) => {
    return await prisma.vessel.update({
        where: { id },
        data,
    });
};

export const deleteVessel = async (id: number) => {
    return await prisma.vessel.delete({
        where: { id },
    });
};