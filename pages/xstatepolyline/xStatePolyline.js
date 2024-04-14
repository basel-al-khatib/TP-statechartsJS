import Konva from "konva";
import { createMachine, interpret } from "xstate";


const stage = new Konva.Stage({
    container: "container",
    width: 400,
    height: 400,
});

const layer = new Konva.Layer();
stage.add(layer);

const MAX_POINTS = 10;
let polyline // La polyline en cours de construction;

const polylineMachine = createMachine(
    {
        /** @xstate-layout N4IgpgJg5mDOIC5QAcD2AbAngGQJYDswA6XCdMAYgFkB5AVQGUBRAYWwEkWBpAbQAYAuohSpYuAC65U+YSAAeiALQB2ZUQBsygIwBOTToAsOgEwBmYwFZlAGhCZEADgtE+enafXH1OretMeAXwDbNCw8QiIIACcAQwB3AigKJlgAYxjkMH4hJBA0MUlpWQUEUz5jIgMDdT4tB2N3Qz4bOyVjAz4iYz51LQsai2NlevUgkIwcAmJo+MSKACEY1IBrWGQlrMFZfIkpGVyS9QdOo99tMoN+s1t7BBVTIj1lHQcDY3ejy4sxvInw6diCXwSVojFYHG42W2ol2RQOiC0Xi6WnKPV8NVq1RuiFMFgeVVMOj4fAMuIc6jeBh+oUmERmQJB9GYbE4vC0OREBT2xQRFmcRPeDjqNQJVmxCAsVQ0RIcqkuyj4pm01L+U0igLmoOYtAAakwobkdoV9qASpcdF0rhY+HjXKYnOKPPjjL5juo8VpfIYVWE1fS5kwAHIAFSYACUDZzYSb5Ih3VoiMoPcpCUn-AYWrdqvjiVojCnelYdMogsEQPhUBA4NDfYRoVy4aalIjnJpdPojGZLJmlOY1NbeqZdHiBqMyzT-iQyGB69GeQgtA8HKYDK7yWdV+TxYpPQ4ugZjgKLIih3yfbSAbNgbPjfPcQnul4TA4fO0heK+gnPZ4+E4D4YX2+UsgA */
        id: "polyLine",

        initial: "idle",

        states : {
            idle: {
                on: {
                    MOUSECLICK: {
                        actions : "createLine",
                target : "drawing"}
                }
            },

            drawing: {
                on: {
                    Escape: {actions :"abandon", target :"idle"},

                    Backspace: {
                        actions: "removeLastPoint",
                        cond: "plusDeDeuxPoints",
                        target: "drawing",
                        internal: true
                    },

                    

                    MOUSECLICK: [{
                        target: "drawing",
                        internal: true,
                        cond: "pasPlein",
                        actions : "addPoint"
                    }, {
                        actions : ["saveLine","addPoint"],
                        target :"idle"
                    }],

                    MOUSEMOVE: {
                        actions:"setLastPoint",
                        internal:true 
                    }
                    ,

                    Enter: {
                        actions: "saveLine",
                        cond: "plusDeDeuxPoints",
                        target: "idle",
                        internal : true

                    }
                }
            }
        }
    },
    // Quelques actions et guardes que vous pouvez utiliser dans votre machine
    {
        actions: {
            // Créer une nouvelle polyline
            createLine: (context, event) => {
                const pos = stage.getPointerPosition();
                polyline = new Konva.Line({
                    points: [pos.x, pos.y, pos.x, pos.y],
                    stroke: "red",
                    strokeWidth: 2,
                });
                layer.add(polyline);
            },
            // Mettre à jour le dernier point (provisoire) de la polyline
            setLastPoint: (context, event) => {
                const pos = stage.getPointerPosition();
                const currentPoints = polyline.points(); // Get the current points of the line
                const size = currentPoints.length;

                const newPoints = currentPoints.slice(0, size - 2); // Remove the last point
                polyline.points(newPoints.concat([pos.x, pos.y]));
                layer.batchDraw();
            },
            // Enregistrer la polyline
            saveLine: (context, event) => {
                const currentPoints = polyline.points(); // Get the current points of the line
                const size = currentPoints.length;
                // Le dernier point(provisoire) ne fait pas partie de la polyline
                const newPoints = currentPoints.slice(0, size - 2);
                polyline.points(newPoints);
                layer.batchDraw();
            },
            // Ajouter un point à la polyline
            addPoint: (context, event) => {
                const pos = stage.getPointerPosition();
                const currentPoints = polyline.points(); // Get the current points of the line
                const newPoints = [...currentPoints, pos.x, pos.y]; // Add the new point to the array
                polyline.points(newPoints); // Set the updated points to the line
                layer.batchDraw(); // Redraw the layer to reflect the changes
            },
            // Abandonner le tracé de la polyline
            abandon: (context, event) => {
                polyline.remove();
            },
            // Supprimer le dernier point de la polyline
            removeLastPoint: (context, event) => {
                const currentPoints = polyline.points(); // Get the current points of the line
                const size = currentPoints.length;
                const provisoire = currentPoints.slice(size - 2, size); // Le point provisoire
                const oldPoints = currentPoints.slice(0, size - 4); // On enlève le dernier point enregistré
                polyline.points(oldPoints.concat(provisoire)); // Set the updated points to the line
                layer.batchDraw(); // Redraw the layer to reflect the changes
            },
        },
        guards: {
            // On peut encore ajouter un point
            pasPlein: (context, event) => {
                return polyline.points().length < MAX_POINTS * 2;
            },
            // On peut enlever un point
            plusDeDeuxPoints: (context, event) => {
                // Deux coordonnées pour chaque point, plus le point provisoire
                return polyline.points().length > 4;
            },
        },
    }
);

// On démarre la machine
const polylineService = interpret(polylineMachine)
    .onTransition((state) => {
        console.log("Current state:", state.value);
    })
    .start();
// On envoie les événements à la machine
stage.on("click", () => {
    polylineService.send("MOUSECLICK");
});

stage.on("mousemove", () => {
    polylineService.send("MOUSEMOVE");
});

// Envoi des touches clavier à la machine
window.addEventListener("keydown", (event) => {
    console.log("Key pressed:", event.key);
    // Enverra "a", "b", "c", "Escape", "Backspace", "Enter"... à la machine
    polylineService.send(event.key);
});