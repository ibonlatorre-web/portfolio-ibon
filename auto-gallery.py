#!/usr/bin/env python3
"""
AUTO-GALLERY GENERATOR - Multi-JSON Version
============================================
Genera un JSON separado por cada carpeta de fotos.

Características:
- Crea un JSON por cada carpeta (ej: tamborrada-2026.json, makax.json)
- Todos los JSONs se guardan en la carpeta json/
- Detecta carpetas nuevas automáticamente
- Crea también un photos-data.json general con todas las fotos

Uso:
    python auto-gallery.py
"""

import os
import sys
import json
from pathlib import Path
from PIL import Image
import re
import hashlib

class Colors:
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BLUE = '\033[94m'
    MAGENTA = '\033[95m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

def print_color(message, color=Colors.ENDC):
    print(f"{color}{message}{Colors.ENDC}")

def print_banner():
    print()
    print_color("╔═══════════════════════════════════════════════════╗", Colors.CYAN)
    print_color("║   AUTO-GALLERY - Multi-JSON Generator            ║", Colors.CYAN)
    print_color("╚═══════════════════════════════════════════════════╝", Colors.CYAN)
    print()

def extract_date_from_filename(filename):
    """Extrae fecha del nombre de archivo"""
    name = Path(filename).stem
    match = re.match(r'^(\d{2})(\d{2})(\d{4})', name)
    if match:
        day, month, year = match.groups()
        return year, month, day
    return None, None, None

def detect_event_from_path(folder_path):
    """Detecta el nombre del evento desde la carpeta"""
    parts = Path(folder_path).parts
    
    if len(parts) > 0:
        event_folder = parts[-1]
        event = event_folder.replace('-', ' ').replace('_', ' ').title()
        
        event_lower = event_folder.lower()
        if 'tamborrada' in event_lower:
            return 'Tamborrada'
        elif 'fermin' in event_lower or 'sanfermin' in event_lower:
            return 'San Fermín'
        elif 'makax' in event_lower or 'makas' in event_lower:
            return 'Makax'
        elif 'aste nagusia' in event_lower or 'astenagusia' in event_lower:
            return 'Aste Nagusia'
        
        year_match = re.search(r'20\d{2}', event_folder)
        if year_match:
            event = event.replace(year_match.group(), '').strip()
        
        return event
    
    return 'Evento'

def detect_category_and_sport(folder_path):
    """Detecta categoría y deporte"""
    path_str = str(folder_path).lower()
    
    category = 'general'
    sport = None
    
    if 'deportiva' in path_str or 'deporte' in path_str:
        category = 'deportiva'
        
        if 'futbol' in path_str or 'football' in path_str or 'futsal' in path_str or 'sala' in path_str:
            sport = 'Fútbol Sala'
        elif 'basket' in path_str:
            sport = 'Baloncesto'
        elif 'surf' in path_str:
            sport = 'Surf'
        elif 'rugby' in path_str:
            sport = 'Rugby'
        elif 'athletic' in path_str or 'atletismo' in path_str:
            sport = 'Atletismo'
        elif 'tennis' in path_str or 'tenis' in path_str:
            sport = 'Tenis'
        elif 'ciclismo' in path_str or 'cycling' in path_str:
            sport = 'Ciclismo'
    
    return category, sport

def create_thumbnail(input_path, output_path, width=600):
    """Crea miniatura de 600px"""
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    try:
        with Image.open(input_path) as img:
            if img.mode in ('RGBA', 'LA', 'P'):
                img = img.convert('RGB')
            
            aspect = img.height / img.width
            new_height = int(width * aspect)
            
            img_resized = img.resize((width, new_height), Image.Resampling.LANCZOS)
            img_resized.save(output_path, 'JPEG', quality=85, optimize=True)
        
        return True
    except Exception as e:
        print_color(f"  ✗ Error creando thumbnail: {e}", Colors.RED)
        return False

def create_optimized(input_path, output_path, width=1600):
    """Crea versión optimizada de 1600px"""
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    try:
        with Image.open(input_path) as img:
            if img.mode in ('RGBA', 'LA', 'P'):
                img = img.convert('RGB')
            
            if img.width <= width:
                img.save(output_path, 'JPEG', quality=90, optimize=True)
            else:
                aspect = img.height / img.width
                new_height = int(width * aspect)
                img_resized = img.resize((width, new_height), Image.Resampling.LANCZOS)
                img_resized.save(output_path, 'JPEG', quality=90, optimize=True)
        
        return True
    except Exception as e:
        print_color(f"  ✗ Error creando optimizada: {e}", Colors.RED)
        return False

def normalize_path(path):
    """Convierte rutas a formato web (barras /)"""
    return str(path).replace('\\', '/')

def get_folder_id(folder_path):
    """Genera un ID único para la carpeta basado en su ruta"""
    # Usar solo el nombre de la carpeta final
    folder_name = Path(folder_path).name
    # Limpiar el nombre para usarlo como nombre de archivo
    clean_name = folder_name.lower().replace(' ', '-')
    return clean_name

def scan_and_process_by_folder(base_path='links'):
    """Escanea y procesa fotos organizadas por carpeta"""
    
    if not os.path.exists(base_path):
        print_color(f"❌ ERROR: No existe la carpeta '{base_path}'", Colors.RED)
        return {}
    
    # Crear carpeta json/
    os.makedirs('json', exist_ok=True)
    
    folders_data = {}
    all_photos = []
    extensions = ['.jpg', '.jpeg', '.JPG', '.JPEG']
    
    print_color("🔍 Escaneando carpetas en links/...", Colors.YELLOW)
    print()
    
    # Encontrar todas las carpetas que contienen fotos
    photo_folders = []
    for root, dirs, files in os.walk(base_path):
        image_files = [f for f in files if any(f.lower().endswith(ext.lower()) for ext in extensions)]
        if image_files:
            photo_folders.append((root, image_files))
    
    total_folders = len(photo_folders)
    print_color(f"📁 Encontradas {total_folders} carpetas con fotos", Colors.CYAN)
    print()
    
    for folder_idx, (root, image_files) in enumerate(photo_folders, 1):
        rel_path = os.path.relpath(root, base_path)
        folder_id = get_folder_id(root)
        
        event_name = detect_event_from_path(root)
        category, sport = detect_category_and_sport(root)
        
        print_color(f"[{folder_idx}/{total_folders}] 📁 {rel_path}/", Colors.BLUE)
        print(f"   Evento: {event_name} | Categoría: {category}" + (f" | Deporte: {sport}" if sport else ""))
        
        folder_photos = []
        
        for filename in sorted(image_files):
            input_path = os.path.join(root, filename)
            rel_from_links = os.path.relpath(input_path, base_path)
            
            thumb_path = normalize_path(os.path.join('thumbs', rel_from_links))
            optimized_path = normalize_path(os.path.join('optimized', rel_from_links))
            
            print(f"   → {filename}...", end=' ')
            
            thumb_ok = create_thumbnail(input_path, thumb_path, width=600)
            opt_ok = create_optimized(input_path, optimized_path, width=1600)
            
            if thumb_ok and opt_ok:
                print_color("✓", Colors.GREEN)
            else:
                print_color("✗", Colors.RED)
                continue
            
            # Extraer metadata
            year, month, day = extract_date_from_filename(filename)
            
            if not year:
                year_match = re.search(r'(20\d{2})', root)
                if year_match:
                    year = year_match.group(1)
                    month = '01'
                    day = '01'
                else:
                    from datetime import datetime
                    now = datetime.now()
                    year = str(now.year)
                    month = str(now.month).zfill(2)
                    day = str(now.day).zfill(2)
            
            # Crear título
            title = Path(filename).stem
            title = re.sub(r'^\d{8}-', '', title)
            title = title.replace('-', ' ').replace('_', ' ').title()
            
            # Crear entrada
            photo_entry = {
                'src': optimized_path,
                'thumb': thumb_path,
                'title': title,
                'category': category,
                'event': event_name,
                'year': year,
                'month': month,
                'day': day
            }
            
            if sport:
                photo_entry['sport'] = sport
            
            folder_photos.append(photo_entry)
            all_photos.append(photo_entry)
        
        # Guardar JSON de esta carpeta
        if folder_photos:
            json_filename = f'json/{folder_id}.json'
            with open(json_filename, 'w', encoding='utf-8') as f:
                json.dump(folder_photos, f, indent=4, ensure_ascii=False)
            
            print_color(f"   ✓ JSON creado: {json_filename} ({len(folder_photos)} fotos)", Colors.GREEN)
            folders_data[folder_id] = {
                'path': rel_path,
                'event': event_name,
                'category': category,
                'sport': sport,
                'json_file': json_filename,
                'photo_count': len(folder_photos)
            }
        
        print()
    
    return folders_data, all_photos

def generate_index_json(folders_data):
    """Genera un JSON índice con información de todas las carpetas"""
    return {
        'folders': folders_data,
        'total_folders': len(folders_data),
        'generated_at': str(Path.cwd())
    }

def main():
    print_banner()
    
    # Verificar Pillow
    try:
        from PIL import Image
    except ImportError:
        print_color("❌ ERROR: Pillow no está instalado", Colors.RED)
        print()
        print("Instala Pillow con:")
        print_color("  pip install Pillow", Colors.CYAN)
        print()
        return
    
    print_color("═" * 55, Colors.CYAN)
    print()
    
    # Procesar carpetas
    folders_data, all_photos = scan_and_process_by_folder('links')
    
    if not all_photos:
        print_color("⚠️  No se encontraron fotos para procesar", Colors.YELLOW)
        return
    
    print_color("═" * 55, Colors.CYAN)
    print()
    print_color("📝 Generando archivos JSON...", Colors.YELLOW)
    print()
    
    # Crear JSON general con todas las fotos
    with open('photos-data.json', 'w', encoding='utf-8') as f:
        json.dump(all_photos, f, indent=4, ensure_ascii=False)
    print_color(f"✓ photos-data.json creado ({len(all_photos)} fotos totales)", Colors.GREEN)
    
    # Crear índice de carpetas
    index_data = generate_index_json(folders_data)
    with open('json/index.json', 'w', encoding='utf-8') as f:
        json.dump(index_data, f, indent=4, ensure_ascii=False)
    print_color(f"✓ json/index.json creado ({len(folders_data)} carpetas)", Colors.GREEN)
    
    print()
    print_color("═" * 55, Colors.CYAN)
    print()
    print_color("✅ PROCESO COMPLETADO", Colors.GREEN)
    print()
    print(f"   📊 Total de fotos procesadas: {len(all_photos)}")
    print(f"   📁 Total de carpetas: {len(folders_data)}")
    print(f"   📄 JSONs individuales en: json/")
    print(f"   📄 JSON general: photos-data.json")
    print()
    
    # Mostrar resumen de carpetas
    print_color("📋 CARPETAS PROCESADAS:", Colors.YELLOW)
    for folder_id, data in folders_data.items():
        print(f"   • {data['event']}: {data['photo_count']} fotos → json/{folder_id}.json")
    print()
    
    print_color("📋 SIGUIENTE PASO:", Colors.YELLOW)
    print()
    print("OPCIÓN A - Subir solo el JSON general (más simple):")
    print("  1. Sube 'photos-data.json' a Antigravity")
    print("  2. Sube carpetas 'thumbs/' y 'optimized/'")
    print()
    print("OPCIÓN B - Usar JSONs individuales (carga bajo demanda):")
    print("  1. Sube toda la carpeta 'json/' a Antigravity")
    print("  2. Sube carpetas 'thumbs/' y 'optimized/'")
    print("  3. Modifica gallery.js para cargar JSONs individuales")
    print()

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print()
        print_color("\n❌ Operación cancelada", Colors.YELLOW)
        sys.exit(0)
