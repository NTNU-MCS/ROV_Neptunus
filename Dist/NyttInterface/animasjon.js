
//load and control the 3d model of neptunus and the compass
//To make the 3d models a library called three.js is used.
//It creates a scene that updates 20 times per second.

var scene, camera, renderer, neptunus, compass;
var zaxis = new THREE.Vector3(0,0,1);

function handleAnimation(){

		//get the container the animation will be in
		var container = document.getElementById("animation_model");

		//creates a new scene
		scene = new THREE.Scene();

		//Creates a camera and set the position and perspective of the camera
		camera = new THREE.PerspectiveCamera( 50, (window.innerHeight/2)/(window.innerHeight/2), 0.1, 1000 );
		camera.position.z = 18;

		//Creates a renderer that updates the scene in the render() function
		renderer = new THREE.WebGLRenderer({ alpha: true });
		renderer.setSize((window.innerHeight/2),(window.innerHeight/2));
		container.appendChild( renderer.domElement );

    //Creates a new light, this is not nessesery, but is needed to get shadows so you see the 3d effects better.
    var light = new THREE.PointLight(0xffffff);
    light.position.set(0,0,100);
    scene.add(light);


		//load the neptunus 3d model build with blender
		var loader = new THREE.JSONLoader();
		loader.load( 'images/neptunus2.json', function ( geometry ) {
			//set the color of neptunus = yellow
			var neptunus_material = new THREE.MeshLambertMaterial( { color: 0xffff00 } );
			neptunus = new THREE.Mesh( geometry, neptunus_material );

							//Set the initial position and orientation of neptunus
							neptunus.position.x =0;
							neptunus.position.y =0;
							neptunus.position.z =0;
							neptunus.rotation.set(Math.PI/2, Math.PI/2, 0);
							//add neptunus to the scene
							scene.add( neptunus );
		});

		//Load the "compass" 3d model build with blender
		var loader_compass = new THREE.JSONLoader();
		loader_compass.load( 'images/Compas.json', function ( geometry ) {
			//set the color of the compass = broun
			var compass_material = new THREE.MeshLambertMaterial( { color: 0x996633 } );
			compass = new THREE.Mesh( geometry, compass_material );

							//Set the initial position and orientation of the compass
							compass.position.x =0;
							compass.position.y =0;
							compass.position.z =0;
							compass.rotation.set(Math.PI/2, Math.PI/2, 0);
							//add compass to the scene
							scene.add( compass );
		});

		//render
		render();

    // Rendering function that updates the orientation of neptunus and the compass
    function render() {
	        requestAnimationFrame(render);
	        renderer.autoClear = false;
	        renderer.clear();
	        renderer.render(scene, camera);
    };
}


//Update neptunus 3d model in roll
function updateNeptunusRoll(roll){
	if(neptunus){
	 neptunus.rotateOnAxis( zaxis	, neptunus.rotation.z + roll/360*Math.PI*2);
	}
}

//Update neptunus 3d model in pitch
function updateNeptunusPitch(pitch){
	if(neptunus){
		neptunus.rotation.x=(Math.PI/2-pitch/360*Math.PI*2);
	}
}

//Update "compass" model in heading
function updateComass3DModel(heading){
		if(compass){
			compass.rotation.y = (Math.PI/2+ heading/360*Math.PI*2);
		}
}
