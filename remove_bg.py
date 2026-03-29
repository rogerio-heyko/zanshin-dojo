from PIL import Image, ImageDraw
import sys

def flood_fill_transparent(input_path, output_path, tolerance=30):
    try:
        img = Image.open(input_path).convert("RGBA")
        width, height = img.size
        
        # We will do a flood fill from the 4 corners.
        # ImageDraw.floodfill actually fills with a color.
        # We will fill the background with a magical transparent color (0,0,0,0).
        
        target_color = img.getpixel((0, 0))
        # If the corner is roughly white
        if target_color[0] > 200 and target_color[1] > 200 and target_color[2] > 200:
            # We use a custom flood fill that tolerates antialiasing
            # Alternatively, PIL's floodfill doesn't support tolerance easily in older versions,
            # but we can do a simple BFS.
            
            pixels = img.load()
            visited = set()
            queue = [(0,0), (width-1, 0), (0, height-1), (width-1, height-1)]
            
            while queue:
                x, y = queue.pop(0)
                if (x, y) in visited:
                    continue
                if x < 0 or x >= width or y < 0 or y >= height:
                    continue
                
                visited.add((x, y))
                p = pixels[x, y]
                
                # Check if it's close to white
                if p[0] > 240 and p[1] > 240 and p[2] > 240 and p[3] > 0:
                    pixels[x, y] = (255, 255, 255, 0) # Make transparent
                    queue.append((x+1, y))
                    queue.append((x-1, y))
                    queue.append((x, y+1))
                    queue.append((x, y-1))
                    
        img.save(output_path, "PNG")
        print(f"Successfully processed {input_path}")
    except Exception as e:
        print(f"Error processing {input_path}: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python script.py <input> <output>")
    else:
        flood_fill_transparent(sys.argv[1], sys.argv[2])
