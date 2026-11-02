# Tu sitio nuevo: andycarrizosa.com

Es un sitio "estático": son archivos HTML comunes, sin base de datos ni nada que instalar.
Se puede subir a cualquier servicio de páginas web. Abajo están los pasos para GitHub Pages, que es gratis.

## Qué hay en esta carpeta

| Archivo o carpeta | Qué es |
|---|---|
| `index.html` | La página de inicio: tu perfil resumido. |
| `blog.html` | Blog y artículos, con botones para filtrar por tipo. |
| `publicaciones.html` | Publicaciones académicas. |
| `en/index.html` | Tu perfil en inglés. |
| `assets/site.css` | Los estilos (colores, letras, espacios) de todas las páginas. |
| `assets/site.js` | El filtro del blog. |
| `assets/fonts/` | Las dos tipografías, guardadas en el sitio (no dependen de Google Fonts). |
| `assets/favicon.svg` | El ícono que aparece en la pestaña del navegador. |
| `assets/og.png` | La imagen que aparece cuando alguien comparte tu link en LinkedIn, WhatsApp, etc. |
| `cv/Andres_Carrizosa_CV.pdf` | Tu CV. Reemplazalo por el PDF que exportes vos desde LibreOffice, con el mismo nombre. |
| `home/`, `academic-publications/`, `blogs-and-articles-spanish/` | Redirecciones: si alguien entra con un link viejo de Google Sites, lo manda a la página nueva. |
| `CNAME` y `.nojekyll` | Dos archivos que necesita GitHub Pages. No los borres. |

## Verlo en tu computadora

Desde la carpeta del sitio:

```bash
python3 -m http.server 8000
```

Después abrí http://localhost:8000 en el navegador.

## Publicarlo con tu dominio (GitHub Pages)

El orden importa: primero GitHub, después el dominio.

1. **Creá un repositorio** en GitHub (por ejemplo `andycarrizosa.com`) y subí el contenido de esta carpeta (los archivos, no la carpeta en sí).
2. En el repositorio: **Settings → Pages**. En "Build and deployment", elegí "Deploy from a branch", rama `main`, carpeta `/ (root)`, y guardá.
3. En la misma pantalla, en **Custom domain**, escribí `www.andycarrizosa.com` y guardá.
4. **En Google Sites**, sacá el dominio personalizado de tu sitio viejo (Configuración → Dominios personalizados).
5. **En el panel de tu dominio** (si lo compraste con Google Domains, ahora está en Squarespace Domains), en la parte de DNS:
   - Borrá el registro `CNAME` de `www` que apunta a `ghs.googlehosted.com` (es el de Google Sites).
   - Creá un registro `CNAME` con nombre `www` y valor `acarrizosa.github.io`.
   - Para el dominio sin "www" (nombre `@`), creá cuatro registros `A` con estos valores:
     `185.199.108.153`, `185.199.109.153`, `185.199.110.153` y `185.199.111.153`.
   - No toques los demás registros (por ejemplo el de `app`, si lo seguís usando).
6. **Esperá.** Los cambios de DNS pueden tardar desde minutos hasta 24 horas.
7. Cuando funcione, volvé a **Settings → Pages** y marcá **Enforce HTTPS** (así tu sitio abre con el candadito).

Guía oficial de GitHub: https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site

## Agregar un artículo nuevo

1. Abrí `blog.html` y buscá el año que corresponde (por ejemplo `<h2 class="grupo-titulo" id="a2025">2025</h2>`).
   Si el año no existe, copiá un bloque `<section class="grupo" ...>` entero y cambiale el año.
2. Copiá un bloque `<li data-tipo="...">` … `</li>` y pegalo arriba de todo en ese año.
3. Cambiá el medio, el tipo, la fecha, el título, el link y el resumen.
   `data-tipo` tiene que ser `blog`, `columna` o `entrevista`, para que funcione el filtro.
4. Actualizá los números de los botones de filtro (Todos, Mi blog, Columnas, Entrevistas) y el texto "Mostrando 8 de 8 textos.".
5. Si querés que aparezca en la portada, copialo también en la sección "Blog y artículos" de `index.html` y borrá el más viejo de esa lista, para que queden cuatro.

## Pendientes antes de cambiar el dominio

- **Tus 4 posts propios todavía apuntan a Google Sites.** Cuando el dominio pase a GitHub, esos links se rompen. Hay que pasar el texto de cada post a una página dentro de este sitio.
- **La fecha de "Sin concertación legislativa…"** quedó como 2022, calculada por el contenido del texto. Confirmala.
- **El CV en PDF tiene tu número de celular.** Si no querés que quede público, sacalo antes de subirlo.
