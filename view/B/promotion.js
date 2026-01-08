document.addEventListener("DOMContentLoaded", function () {
    const countryId = localStorage.getItem("countryId") || 1; // fallback
    const promoList = document.getElementById("promotionList");

    fetch(`/api/getAllPromotions?countryId=${countryId}`)
        .then((res) => res.json())
        .then((data) => {
            data.forEach((promo) => {
                const card = document.createElement("div");
                card.className = "promo-card";
                card.style.backgroundImage = `url(${promo.imageURL})`;

                const overlay = document.createElement("div");
                overlay.className = "promo-overlay";

                overlay.innerHTML = `
  <div class="promo-gradient"></div>

  <div class="promo-content">
    <div class="promo-title">${promo.description}</div>
    <div class="promo-discount">${promo.discountRate}% OFF</div>
    <button class="shop-btn">SHOP NOW</button>
  </div>
`;


                overlay.querySelector(".shop-btn").addEventListener("click", () => {
                    window.location.href =
                        `/B/SG/furnitureProductDetails.html?sku=${promo.sku}`;
                });

                card.appendChild(overlay);
                promoList.appendChild(card);
            });
        })
        .catch((err) => {
            console.error("Failed to load promotions", err);
            promoList.innerHTML =
                "<p class='text-center'>Failed to load promotions.</p>";
        });
});
