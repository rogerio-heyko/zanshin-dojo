from PIL import Image
import sys

def flood_fill_transparent(input_path, output_path):
    try:
        img = Image.open(input_path).convert("RGBA")
        width, height = img.size
        pixels = img.load()
        
        # Start from slightly inside to avoid 1px borders
        queue = [(5, 5), (width-5, 5), (5, height-5), (width-5, height-5)]
        
        visited = set()
        
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
