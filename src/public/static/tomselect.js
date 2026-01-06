new TomSelect("#select-tags",{
    plugins: ['remove_button'],
    create: true,
    onItemAdd:function(){
        this.setTextboxValue('');
        this.refreshOptions();
    },
    render:{
        option:function(data,escape){
            return '<div class="d-flex"><span>' + escape(data.value) + '</span><span class="ms-auto text-muted">' + escape(data.date) + '</span></div>';
        },
        item:function(data,escape){
            return '<div>' + escape(data.value) + '</div>';
        }
    }
});

new TomSelect("#select-tags2",{
    plugins: ['remove_button'],
 
	createOnBlur: true,

    render:{
        option:function(data,escape){
            return '<div class="d-flex"><span>' +'__'+ escape(data.value) + '</span><span class="ms-auto text-muted">' + escape(data.date) + '</span></div>';
        },
        item:function(data,escape){
            return '<div>' +'---'+ escape(data.value) + '</div>';
        }
    }
});
new TomSelect("#selectbeast",{
	create: true,
	sortField: {
		field: "text",
		direction: "asc"
	}
});

// new TomSelect("#select-cat",{
//     plugins: ['remove_button'],
// 	create: false,
// });

function getJobtitle(){
    //let t1 = JSON.stringify(document.getElementById("title2").innerHTML)
    let t1 =  document.getElementById("title").innerHTML
    //alert('t1'+t1)
    //// let t2 = document.getElementById("title2").value
    //// {# alert(' t1 t2  '+ t1 +' '+t2 ) #}
    //t1= JSON.stringify({'title': t1})

    let t2 =  document.getElementById("title2").innerHTML
    alert('t1'+t1+' '+t2);//+' '+selectedmenu)
    return t1
    }