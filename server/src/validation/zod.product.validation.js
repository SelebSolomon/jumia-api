const {z} = require('zod')


exports.postProduct = z.object({
    name: z.string().min(1, 'Name should not be empty'),
    price: z.number().min(1, "Price must not be empty"), 
    description: z.string().min(1, 'Description must not be empty'),
    stock: z.number().default(0),
    images: z.string().optional() 
    

})