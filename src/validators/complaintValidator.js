import { z } from 'zod';

export const createComplaintSchema = z.object({
  category: z.enum(['pothole', 'drainage', 'garbage', 'water_leak', 'electric_issue']),
  title: z.string().min(5, 'Title must be at least 5 characters').max(100),
  description: z.string().min(20, 'Description must be at least 20 characters').max(1000),
  lat: z.string().or(z.number()).transform(Number).pipe(z.number().min(-90).max(90)),
  lng: z.string().or(z.number()).transform(Number).pipe(z.number().min(-180).max(180)),
  address: z.string().max(200).optional().default(''),
});
