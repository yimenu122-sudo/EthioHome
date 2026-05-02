const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/wishlist.controller');
const auth = require('../middlewares/auth.middleware');

router.use(auth);

router.post('/', wishlistController.addToWishlist);
router.get('/', wishlistController.getWishlist);
router.delete('/:property_id', wishlistController.removeFromWishlist);

module.exports = router;
