

var scene, camera, animationContainer, renderer, neptunus, compass;
var rotation_matrix;
var Xaxis = new THREE.Vector3(1,0,0);
var forrigeRoll = 0;

function handleAnimation(){

		var container = document.getElementById("animation_model");
		scene = new THREE.Scene();

		camera = new THREE.PerspectiveCamera( 50, (window.innerHeight/2)/(window.innerHeight/2), 0.1, 1000 );
		camera.position.z = 18;

		renderer = new THREE.WebGLRenderer({ alpha: true });
		renderer.setSize((window.innerHeight/2),(window.innerHeight/2));
		container.appendChild( renderer.domElement );

    //light
    var light = new THREE.PointLight(0xffffff);
    light.position.set(0,0,100);
    scene.add(light);

		//neptunus
		var loader = new THREE.JSONLoader();
		loader.load( 'images/neptunus2.json', function ( geometry ) {
			var neptunus_material = new THREE.MeshLambertMaterial( { color: 0xffff00 } );
			neptunus = new THREE.Mesh( geometry, neptunus_material );

							neptunus.position.x =0;
							neptunus.position.y =0;
							neptunus.position.z =0;
							neptunus.rotation.set(Math.PI/2, Math.PI/2, 0);
							scene.add( neptunus );
		});

		//compass
		var loader_compass = new THREE.JSONLoader();
		loader_compass.load( 'images/Compas.json', function ( geometry ) {
			var compass_material = new THREE.MeshLambertMaterial( { color: 0x996633 } );
			compass = new THREE.Mesh( geometry, compass_material );

							compass.position.x =0;
							compass.position.y =0;
							compass.position.z =0;
							compass.rotation.set(Math.PI/2, Math.PI/2, 0);
							scene.add( compass );
		});


		render();




    // Rendering function
    function render() {
	        requestAnimationFrame(render);

	        renderer.autoClear = false;
	        renderer.clear();
	        renderer.render(scene, camera);
    };
}

function updateNeptunusRoll(roll){
	if(neptunus){
	 //neptunus.rotation.z=(roll/360*Math.PI*2);

	 var diff = - (forrigeRoll - roll/360*Math.PI*2);
	 neptunus.rotateOnAxis( Xaxis	, diff);
	 forrigeRoll = roll/360*Math.PI*2;
	 console.log("roll " + roll);
	 console.log(diff);
	}

}

function updateNeptunusPitch(pitch){
	if(neptunus){
		neptunus.rotation.x=(-pitch/360*Math.PI*2);
		console.log("pitch " + pitch);
		console.log(-pitch/360*Math.PI*2);
	}

}

function updateComass3DModel(heading){
		if(compass){
			compass.rotation.y = (Math.PI/2+ heading/360*Math.PI*2);
		}
}
