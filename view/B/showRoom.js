var countryPrefix = localStorage.getItem("urlPrefix");
var roomName = new URLSearchParams(window.location.search).get("room");

if (!roomName) {
  window.location.href = "/B/" + countryPrefix + "/index.html";
}

fetch("/api/getShowRoomByName?name=" + encodeURIComponent(roomName))
  .then(res => res.json())
  .then(data => {

    document.getElementById("roomTitle").innerText = data.name;
    document.getElementById("showroomImage").src = data.imageURL;

    var container = document.getElementById("showroomContainer");
    container.querySelectorAll(".hotspot").forEach(h => h.remove());

    // Create hotspots
    data.items.forEach(item => {
      var hotspot = document.createElement("div");
      hotspot.className = "hotspot";

      hotspot.style.left = item.xPercent + "%";
      hotspot.style.top = item.yPercent + "%";
      hotspot.style.width = item.widthPercent + "%";
      hotspot.style.height = item.heightPercent + "%";

      hotspot.setAttribute("data-bs-toggle", "tooltip");
      hotspot.setAttribute(
        "data-bs-title",
        "<strong>" + item.name + "</strong><br>" + item.description
      );
      hotspot.setAttribute("data-bs-html", "true");

      hotspot.onclick = function () {
        window.location.href =
          "/B/" + countryPrefix +
          "/furnitureProductDetails.html?sku=" + item.sku;
      };

      container.appendChild(hotspot);
    });

    initTooltips();
  })
  .catch(err => console.log(err));

function initTooltips() {
  document
    .querySelectorAll('[data-bs-toggle="tooltip"]')
    .forEach(el => {
      new bootstrap.Tooltip(el, {
        container: 'body',
        placement: 'right',   
        trigger: 'hover'
      });
    });
}
