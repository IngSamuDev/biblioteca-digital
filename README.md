# Juego de Lucha en Java - Refinamiento con Patrones de Diseño y Pruebas

Samuel Garcia Guerrero

Angie Julieth Brito Urquijo 

# Resumen

El presente trabajo tiene como objetivo que los estudiantes realicen un refinamiento arquitectónico de un juego de lucha por turnos, aplicando patrones de diseño creacionales y estructurales. Adicionalmente, deberán implementar un conjunto completo de pruebas unitarias utilizando JUnit y Mockito, así como configurar un pipeline de integración continua con GitHub Actions, todo ello utilizando GitHub Codespaces como entorno de desarrollo.

## 1. Descripción General

Este proyecto consiste en el refinamiento arquitectónico de un juego de lucha por turnos desarrollado en Java, aplicando patrones de diseño orientados a objetos para mejorar:

- Flexibilidad
- Escalabilidad
- Reutilización
- Mantenibilidad
- Facilidad de pruebas unitarias

El juego está inspirado en el universo de Mario Bros y permite que diferentes personajes combatan utilizando estrategias de ataque y power-ups dinámicos.

# 2. Objetivo del Proyecto

Aplicar patrones de diseño creacionales y estructurales en un videojuego sencillo de combate por turnos utilizando:

- Java 17
- Maven
- JUnit 5
- Mockito
- GitHub Actions
- GitHub Codespaces

# 3. Personajes del Juego

Los personajes disponibles son:

| Personaje | Estrategia Natural |
| --- | --- |
| Mario | Salto |
| Luigi | Salto |
| Bowser | Golpe de Bowser |
| Peach | Bola de Fuego |

Cada personaje posee:

- Nombre
- Puntos de vida
- Estrategia de ataque
- Power-ups opcionales

# 4. Patrones de Diseño Utilizados

En este proyecto se implementaron cuatro patrones principales para mejorar la flexibilidad, escalabilidad y mantenibilidad del juego de lucha temático de Mario Bros.

# 4.1 Strategy Pattern

El patrón **Strategy** permite definir diferentes formas de realizar una acción y cambiar ese comportamiento dinámicamente durante la ejecución del programa.

En este proyecto, se utiliza para manejar las distintas formas de ataque de los personajes.

## Problema que resuelve

Sin el patrón Strategy, cada personaje tendría el código de ataque directamente dentro de su clase.

Esto genera varios problemas:

- Código repetido
- Difícil agregar nuevos ataques
- Mucho acoplamiento
- Poco flexible

Si luego se quisiera que Mario pudiera usar fuego o ataques especiales, habría que modificar la clase directamente.

### Cómo funciona en el juego

Cada personaje posee un tipo de ataque natural:

| Personaje | Estrategia |
| --- | --- |
| Mario | Salto |
| Luigi | Salto |
| Bowser | Golpe Bowser |
| Peach | Bola de fuego |

Pero la estrategia puede cambiar en runtime.

Ejemplo:

```java
mario.setEstrategia(new AtaqueBolaDeFuego());
```

Ahora Mario podrá atacar con fuego sin cambiar su clase.

### Ventajas

| Ventaja | Explicación |
| --- | --- |
| Flexibilidad | Cambiar ataques fácilmente |
| Extensible | Agregar nuevos ataques sin modificar código existente |
| Bajo acoplamiento | Personaje no conoce detalles del ataque |
| Reutilización | Varias clases pueden compartir estrategias |

# 4.2 Decorator Pattern

Este patrón permite agregar habilidades o mejoras a un personaje sin modificar la clase original.

En el juego se usa para los power-ups.

### Power-ups implementados

| Power-up | Función |
| --- | --- |
| Estrella | Duplica el daño |
| Hongo | Aumenta +50 HP |
| Flor de fuego | Agrega ataque extra |

### Ejemplo

```java
mario = new EstrellaSuperDecorator(mario);
```

### Ventajas

- Los power-ups pueden combinarse
- No es necesario crear muchas clases nuevas
- Fácil agregar nuevos poderes

# 4.3 Factory Method

Este patrón se encarga de crear personajes automáticamente con sus características y ataques naturales.

### Ejemplo

```java
Personaje mario = MarioFactory.crear(
    TipoPersonaje.MARIO,
    "Mario"
);
```

La fábrica asigna automáticamente:

- Mario → Salto
- Luigi → Salto
- Bowser → Golpe fuerte
- Peach → Bola de fuego

### Ventajas

- Centraliza la creación de personajes
- Reduce el acoplamiento
- Facilita agregar nuevos personajes

---

# 4.4 Builder Pattern

Este patrón permite construir personajes personalizados paso a paso.

Se utiliza cuando un personaje necesita varias configuraciones.

### Ejemplo

```java
Personaje custom = new PersonajeBuilder()
        .setNombre("Mario Pro")
        .setVida(200)
        .setEstrategia(new AtaqueBolaDeFuego())
        .build();
```

### Ventajas

- Código más limpio y legible
- Fácil crear personajes personalizados
- Evita constructores demasiado largos

# Diagrama de Clases

<img width="1353" height="755" alt="image" src="https://github.com/user-attachments/assets/e9cfa163-3671-40b2-a474-0294fe4f0170" />

# 5. Resultados de las Pruebas Unitarias y Cobertura

<img width="1367" height="420" alt="image" src="https://github.com/user-attachments/assets/5161b44a-7be1-4bf5-8e6c-26f1dce51883" />

Para validar el correcto funcionamiento del proyecto se realizaron pruebas unitarias utilizando:

- JUnit 5
- JaCoCo
- Maven

Las pruebas permitieron verificar el comportamiento de las clases principales del sistema, así como los patrones de diseño implementados.

# Resultado General de Cobertura

El proyecto obtuvo una cobertura total del:

## 94% de instrucciones cubiertas

Esto demuestra que la mayoría del código fue ejecutado y validado mediante pruebas unitarias.

---

# Cobertura por paquetes

| Paquete | Cobertura |
| --- | --- |
| `com.juego.patrones.strategy` | ✅ 100% |
| `com.juego.patrones.builder` | ✅ 100% |
| `com.juego.model` | ✅ 98% |
| `com.juego.juego` | ✅ 95% |
| `com.juego` | ✅ 90% |
| `com.juego.patrones.factory` | ✅ 89% |
| `com.juego.patrones.decorator` | ✅ 89% |

# Análisis de los Resultados

Los resultados obtenidos muestran que todas las funcionalidades principales del videojuego fueron probadas correctamente.

Se validaron aspectos importantes como:

- creación de personajes
- ataques
- cambios de estrategia
- funcionamiento de los power-ups
- combate entre personajes
- construcción de personajes personalizados
- ejecución general del sistema

Los paquetes con mayor cobertura fueron:

- `Strategy`
- `Builder`
- `Model`

alcanzando entre 98% y 100% de cobertura.

Esto garantiza que las mecánicas principales del juego funcionan correctamente.

# Validación de Patrones de Diseño

Durante las pruebas también se verificó el comportamiento de los patrones de diseño implementados:

## Strategy

Se comprobó que cada personaje puede cambiar dinámicamente su forma de ataque.

## Factory Method

Se validó la creación automática de personajes con sus estrategias correspondientes.

## Builder

Se verificó la construcción personalizada de personajes.

## Decorator

Se probaron los power-ups del juego, como:

- Estrella
- Hongo
- Flor de Fuego

confirmando que modifican correctamente el comportamiento del personaje.

# Herramienta JaCoCo

JaCoCo permitió generar reportes de cobertura en formato HTML para analizar:

- líneas ejecutadas
- métodos cubiertos
- clases probadas
- porcentaje total de cobertura

El reporte fue generado utilizando el comando:

```java
mvn clean verify
```

```java
mvn exec:java -Dexec.mainClass="com.juego.Main”
```
