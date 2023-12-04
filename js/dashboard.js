function saveOptions(e) {
  e.preventDefault();
  chrome.storage.local.set({
    data: {
      frequency: $("#interval").children(":selected").attr("value"),
      mangaTags: $('#chips').material_chip('data'),
      debugMode: $('#debug').prop('checked')
    }
  });
  document.getElementById('frequencynot').innerText = "Current Frequency for checking: " + $("#interval").children(":selected").attr("value") + " hour(s)";
  Materialize.toast('Changes saved successfully!', 4000)
}

function restoreOptions() {
  console.log("DOMContentLoaded");
  function setCurrentChoice(result) {
    console.log("setCurrentChoice as:",result);
    let freq

    if (result && result.data && result.data.frequency){ //(result !== undefined && result.data.frequency !== undefined)
      console.log("bon result GOOD", result);
      freq = result.data.frequency;
      //document.getElementById('interval').value = result.data.frequency;
      //$("#interval").val(result.data.frequency).trigger('change'); //isnt this just redundant in order to trigger?!? TBD**
    } else {
      console.log("bon result BAAD", result);
      freq = 1;
      //document.getElementById('interval').value = 1 ; 
      //$("#interval").val(1).trigger('change'); //same concern as above...toSee**
    }
    document.getElementById('interval').value = freq;
    $("#interval").val(freq).trigger('change');
    document.getElementById('frequencynot').innerText = "Current Frequency for checking: " + freq + " hour(s)";
    
    $('#chips').material_chip({
      placeholder: 'Enter a tag',
      limit: Infinity,
      minLength: 1,
      data: result?.data?.mangaTags ?? ''
    });
    document.getElementById('debug').checked = result?.data?.debugMode;
    // console.log(result.data.mangaTags);
  }

  function onError(error) {
    console.log(`Error: ${error}`);
    Materialize.toast(`Error: ${error}`, 4000)
  }

  //var getting = chrome.storage.local.get("data",function (result){setCurrentChoice(result)}) || chrome.storage.local.get("data");
  var getting = chrome.storage.local.get("data");
  getting.then(setCurrentChoice, onError);
}

function formatState(state) {
  if (!state.id) {
    return state.text;
  }
  var $state = $(
    '<span>' + state.text + '</span>'
  );
  // console.log(state.text);
  return $state;
};
$('.js-example-basic-single').select2({
  templateSelection: formatState
});
$('.chips').material_chip({
  placeholder: 'Enter a tag',
  limit: Infinity
});
document.addEventListener("DOMContentLoaded", restoreOptions);
document.querySelector("form").addEventListener("submit", saveOptions);
(function ($) {
  $(function () {

    $('.button-collapse').sideNav();

  }); // end of document ready
})(jQuery);
