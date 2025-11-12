# Project PRJ001 - The Sukhumvit Residence
## Deployment Package

This is a standalone deployment package for **The Sukhumvit Residence** (prj001) that can be deployed to:
- ✅ **Netlify** (as web app)
- ✅ **Yodeck** (loads Netlify URL as HTML app)

## 📁 Package Contents

### HTML Files
- `index.html` - Main signage player
- `menu.html` - Navigation menu
- `category.html` - Category listings
- `product.html` - Product details

### Data Files (Project-Specific)
- `data/project.json` - Project metadata (filtered to prj001 only)
- `data/playlist.json` - Media playlist for prj001
- `data/pm.json` - Property management data
- `data/announce.json` - Announcements
- `data/medias.json` - Media assets
- Category files: `dining.json`, `delivery.json`, `daily.json`, `ondemand.json`, `deal.json`, `juristic.json`, `market.json`, `shop.json`, `unit.json`, `foodie.json`
- `data/menu/` - Restaurant menu files

### Assets
- `images/` - All images and logos
- `medias/` - Video files and media assets

## 🚀 Deployment Instructions

### For Netlify:
1. Upload this entire folder to Netlify
2. Set build command: (none needed)
3. Set publish directory: `/` (root)
4. Deploy URL will be: `prj001.netlify.app`

### For Yodeck:
1. Deploy to Netlify first
2. In Yodeck, create new web app
3. Set URL to: `https://prj001.netlify.app`
4. Configure display settings
5. Yodeck will load the web app

## 📊 Data Structure
- **Single Project**: Only prj001 data included
- **Lightweight**: ~12 JSON files vs 22+ in original
- **Self-contained**: No external dependencies
- **Compatible**: Same structure for both platforms

## 🎯 Entry Points
- **Signage Player**: `/index.html?project_id=prj001`
- **Main Menu**: `/menu.html?project_id=prj001`
- **Categories**: `/category.html?type={category}&project_id=prj001`
- **Products**: `/product.html?type={type}&id={id}&project_id=prj001`

Now I'll add the status overlay for condo in unit.json. For colors, I recommend:
  - "available": Green (#22c55e)
  - "booked": Orange/Yellow (#f59e0b)
  - "sold out"/"rented": Red (#ef4444)