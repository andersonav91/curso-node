const cursos = require('./cursos.js');
const fs = require('fs');
const opciones = {
	id:{
		demand: true,
		alias: 'i'
	},
	nombre:{
		demand: true,
		alias: 'n'
	},
	cedula:{
		demand: true,
		alias: 'c'
	},
};
const yargs = require('yargs').command('*', 'Lista de cursos disponibles', {},
	// primer caso de uso
	// node principal.js
	function(argv){
		for (let i = 0; i < cursos.length; i++){
		setTimeout(function() {
			const curso = cursos[i];
			console.log("El curso se llama ", curso.nombre, " con id ", curso.id, ", tiene una duración de ", 
			curso.duracion, " y un valor de ", curso.valor, ".");
		  }, 2000 * (i + 1));
		}
	}
).command('inscribir', 'Inscribirme a un curso', opciones, 
    // segundo caso de uso
	// node principal.js inscribir -c=1234 -i=1 -n="Pepito Perez"
	function(argv){
		let curso = cursos.find( c => c.id == argv.i);
		if (curso){
			fs.writeFile("matricula.txt", 
			"El estudiante " + argv.n + " con cédula " + argv.c + " se ha matriculado en el curso llamado " + curso.nombre +
			", este tiene una duración de " + curso.duracion + " y un valor de " + curso.valor + ".",
			function(err) {
				if(err) {
					return console.log(err);
				}
				console.log("Se ha creado el archivo y matriculado al estudiante.");
			});
		}
		else{
			console.log("No se encuentra el curso con id " + argv.i + ".");
		}
	}
).argv;
