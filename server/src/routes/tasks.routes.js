const { Router } = require('express');
const c = require('../controllers/tasks.controller');
const { validate, validateId } = require('../middleware/validate');
const {
  createTaskSchema,
  updateTaskSchema,
  statusSchema,
  listQuerySchema,
  weeksQuerySchema,
} = require('../validators/task.schema');

// Express 5 forwards errors thrown in async handlers to the error middleware.
const router = Router();

router.get('/', validate(listQuerySchema, 'query'), c.listTasks);
router.get('/weeks', validate(weeksQuerySchema, 'query'), c.weekSummaries); // before /:id
router.post('/', validate(createTaskSchema), c.createTask);
router.get('/:id', validateId, c.getTask);
router.patch('/:id', validateId, validate(updateTaskSchema), c.updateTask);
router.patch('/:id/status', validateId, validate(statusSchema), c.updateStatus);
router.delete('/:id', validateId, c.deleteTask);

module.exports = router;
