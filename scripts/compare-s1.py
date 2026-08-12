import sys
import subprocess

# Install pillow if not available
try:
    from PIL import Image, ImageChops
except ImportError:
    print("Installing pillow...")
    subprocess.run([sys.executable, "-m", "pip", "install", "pillow", "-q"], capture_output=True)
    from PIL import Image, ImageChops

baseline_path = "artwork/living-datacenter/refcheck/baseline-pre-fidelity/gaps-S1-boot.png"
current_path = "artwork/living-datacenter/refcheck/current-s1-boot.png"

baseline = Image.open(baseline_path)
current = Image.open(current_path)

print(f"Baseline: {baseline.size} mode={baseline.mode}")
print(f"Current:  {current.size} mode={current.mode}")

# Resize current to match baseline if needed
if current.size != baseline.size:
    current = current.resize(baseline.size)
    print(f"Resized current to: {current.size}")

# Compute difference
diff = ImageChops.difference(baseline.convert("RGB"), current.convert("RGB"))

# Count differing pixels
diff_data = list(diff.getdata())
total_pixels = len(diff_data)
differing = sum(1 for r, g, b in diff_data if r > 5 or g > 5 or b > 5)
diff_percentage = (differing / total_pixels) * 100

print(f"\n--- Visual Comparison Results ---")
print(f"Total pixels:     {total_pixels}")
print(f"Differing pixels:  {differing}")
print(f"Diff percentage:   {diff_percentage:.2f}%")

# Get bounding box of differences
bbox = diff.getbbox()
if bbox:
    print(f"Difference bbox:   {bbox}")
else:
    print("Images are identical!")

# Save diff image
diff_path = "artwork/living-datacenter/refcheck/s1-diff-overlay.png"
# Create a more visible diff
diff_enhanced = ImageChops.multiply(diff, Image.new("RGB", diff.size, (10, 1, 1)))
diff_enhanced = ImageChops.add(diff_enhanced, diff_enhanced)
diff_enhanced.save(diff_path)
print(f"\nDiff overlay saved: {diff_path}")

# Interpretation
if diff_percentage < 1:
    print("\n[PASS] Images are visually identical (diff < 1%)")
elif diff_percentage < 5:
    print(f"\n[MINOR] Small differences detected ({diff_percentage:.2f}%)")
else:
    print(f"\n[SIGNIFICANT] Large differences detected ({diff_percentage:.2f}%)")

print(f"\n--- Notes ---")
print("The 3D canvas has animated particles and lighting, so frame-by-frame")
print("differences are expected. Focus on structural elements:")
print("  - Rack geometry should be present")
print("  - Mesh door patterns should be visible")
print("  - Chassis/bezel clearcoat should be applied")
