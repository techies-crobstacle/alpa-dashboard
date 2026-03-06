# Postman Testing Guide for Gallery Image Upload

## How to Test Your Backend with Postman

### Pre-requisites
- Get a product ID that has existing gallery images
- Have 1-2 image files ready to test with

### Step 1: Create Request
1. **Method**: PUT
2. **URL**: `http://your-api.com/api/products/PRODUCT_ID_HERE`
3. **Authentication**: Add your auth token if needed (Header → Authorization: Bearer YOUR_TOKEN)

### Step 2: Set Body to form-data
1. Click "Body" tab
2. Select "form-data" radio button

### Step 3: Add Form Fields
Add these fields in exact order:

| Key | Type | Value |
|-----|------|-------|
| `title` | text | Your Product Title |
| `description` | text | Your description |
| `price` | text | 99.99 |
| `stock` | text | 10 |
| `category` | text | Electronics |
| `tags` | text | tag1, tag2 |
| `existingGalleryImages` | text | `https://existing-image-1.com/image1.jpg` |
| `existingGalleryImages` | text | `https://existing-image-2.com/image2.jpg` |
| `galleryImages` | file | **Select file: new_image_1.jpg** |
| `galleryImages` | file | **Select file: new_image_2.jpg** |

**⚠️ IMPORTANT**: 
- Add `existingGalleryImages` **as text**, not file
- Add `galleryImages` **as files**, not text
- You can have MULTIPLE fields with the same key name

### Step 4: Expected Response
```json
{
  "success": true,
  "product": {
    "id": "...",
    "title": "Your Product Title",
    "galleryImages": [
      "https://existing-image-1.com/image1.jpg",
      "https://existing-image-2.com/image2.jpg",
      "https://new-uploaded-file-path/new_image_1.jpg",
      "https://new-uploaded-file-path/new_image_2.jpg"
    ]
  }
}
```

The array should have **4 images** (2 old + 2 new).

### Test Scenarios

#### Scenario 1: Add new images without deleting old ones
```
existingGalleryImages: old_image_1.jpg url ✓
existingGalleryImages: old_image_2.jpg url ✓
galleryImages: new_image_1.jpg file
galleryImages: new_image_2.jpg file
```
**Expected**: 4 images in response (all preserved + new ones added)

#### Scenario 2: Delete some old images before adding new ones
```
existingGalleryImages: old_image_1.jpg url ✓
galleryImages: new_image_1.jpg file
galleryImages: new_image_2.jpg file
```
**Expected**: 3 images in response (1 old kept + 2 new added)

#### Scenario 3: Only delete old images, don't add new ones
```
existingGalleryImages: old_image_1.jpg url ✓
```
**Expected**: 1 image in response (only the kept old image)

#### Scenario 4: Replace all images completely
```
galleryImages: brand_new_image_1.jpg file
galleryImages: brand_new_image_2.jpg file
```
**Expected**: 2 images in response (no old ones, only new files)

## Debugging: Check the Request Payload

1. Click "Code" button in Postman (top right)
2. Select "cURL" 
3. Look for lines like:
   ```
   -F 'existingGalleryImages=https://old-image.jpg'
   -F 'galleryImages=@/path/to/new_image.jpg'
   ```

The `-F` flag indicates form-data fields.

## If Backend Still Not Working

1. **Check your endpoint code** - verify it reads both:
   - `req.body.existingGalleryImages` 
   - `req.files` (or `req.body.galleryImages`)

2. **Verify console logs** - add these logs in your backend:
   ```javascript
   console.log('Existing Gallery:', req.body.existingGalleryImages);
   console.log('New Files:', req.files?.map(f => f.filename));
   ```

3. **Check database** - query the product directly:
   ```javascript
   db.products.findById("PRODUCT_ID")
   ```
   Should show ALL images in `galleryImages` array.

4. **Test without frontend** - if Postman works but frontend doesn't:
   - The issue is in how frontend sends data
   - Check browser DevTools → Network tab
   - Look at the actual FormData being sent

## Postman Collection Tips

Save this as a **Postman Collection** for easy repeating:
1. Click "Save as → Save as collection"
2. Name: "Product Gallery Test"
3. Test whenever you change backend code
4. Share with team for consistent testing

