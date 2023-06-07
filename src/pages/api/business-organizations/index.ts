import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from 'server/db';
import { authorizationValidationMiddleware, errorHandlerMiddleware } from 'server/middlewares';
import { businessOrganizationValidationSchema } from 'validationSchema/business-organizations';
import { convertQueryToPrismaUtil } from 'server/utils';
import { getServerSession } from '@roq/nextjs';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { roqUserId, user } = await getServerSession(req);
  switch (req.method) {
    case 'GET':
      return getBusinessOrganizations();
    case 'POST':
      return createBusinessOrganization();
    default:
      return res.status(405).json({ message: `Method ${req.method} not allowed` });
  }

  async function getBusinessOrganizations() {
    const data = await prisma.business_organization
      .withAuthorization({
        roqUserId,
        tenantId: user.tenantId,
        roles: user.roles,
      })
      .findMany(convertQueryToPrismaUtil(req.query, 'business_organization'));
    return res.status(200).json(data);
  }

  async function createBusinessOrganization() {
    await businessOrganizationValidationSchema.validate(req.body);
    const body = { ...req.body };
    if (body?.environmental_data?.length > 0) {
      const create_environmental_data = body.environmental_data;
      body.environmental_data = {
        create: create_environmental_data,
      };
    } else {
      delete body.environmental_data;
    }
    if (body?.environmental_goal?.length > 0) {
      const create_environmental_goal = body.environmental_goal;
      body.environmental_goal = {
        create: create_environmental_goal,
      };
    } else {
      delete body.environmental_goal;
    }
    if (body?.suggestion?.length > 0) {
      const create_suggestion = body.suggestion;
      body.suggestion = {
        create: create_suggestion,
      };
    } else {
      delete body.suggestion;
    }
    const data = await prisma.business_organization.create({
      data: body,
    });
    return res.status(200).json(data);
  }
}

export default function apiHandler(req: NextApiRequest, res: NextApiResponse) {
  return errorHandlerMiddleware(authorizationValidationMiddleware(handler))(req, res);
}