# Gallery Image Upload Fix

## Frontend Changes
The frontend now sends gallery images in **two separate fields**:
- `existingGalleryImages`: URLs of images to keep (old images)
- `galleryImages`: New image files to upload

## Backend Requirements
Your `/api/products/:id` PUT endpoint must handle both fields:

### Node.js/Express Example (Multer):
```javascript
router.put('/products/:id', upload.array('galleryImages'), async (req, res) => {
  try {
    const productId = req.params.id;
    const { existingGalleryImages } = req.body; // Parse as array if string
    
    // Parse existing images from form
    let existingImages = [];
    if (existingGalleryImages) {
      existingImages = Array.isArray(existingGalleryImages) 
        ? existingGalleryImages 
        : [existingGalleryImages];
    }
    
    // Get newly uploaded files
    const newImages = req.files?.map(f => f.path) || [];
    
    // IMPORTANT: Merge, don't replace
    const allGalleryImages = [...existingImages, ...newImages];
    
    // Update product with merged images
    const product = await Product.findByIdAndUpdate(
      productId,
      { 
        galleryImages: allGalleryImages,
        // ... other fields
      },
      { new: true }
    );
    
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
```

### Key Points:
1. **Parse `existingGalleryImages`** from `req.body` - these are string URLs
2. **Get new files** from `req.files` - these are uploaded files
3. **Merge arrays** together (concat, don't replace)
4. **Save merged array** to database

### Common Mistakes to Avoid:
❌ Only using `req.files` (ignores old images)
❌ Only using `req.body.galleryImages` (ignores new files) 
❌ Using `$set` operator without merging (overwrites existing)
✅ Always merge existing + new before saving

## Testing in Postman:
1. Go to your PUT `/api/products/:id` request
2. Set "body" to "form-data"
3. Add fields:
   - `existingGalleryImages` (text): old image URL 1
   - `existingGalleryImages` (text): old image URL 2
   - `galleryImages` (file): new_image1.jpg
   - `galleryImages` (file): new_image2.jpg
4. All images should be saved together
