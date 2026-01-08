document.addEventListener("DOMContentLoaded", function () {
  const countryId = localStorage.getItem("countryId") || 1;

  const overlay = document.getElementById("bestPromoOverlay");
  const img = document.getElementById("promoPopupImage");
  const title = document.getElementById("promoPopupTitle");
  const discount = document.getElementById("promoPopupDiscount");
  const btn = document.getElementById("promoPopupBtn");
  const closeBtn = document.querySelector(".promo-close");

  if (sessionStorage.getItem("promoShown")) return;

  fetch(`/api/getBestPromotion?countryId=${countryId}`)
    .then(res => res.json())
    .then(promo => {
      if (!promo || !promo.imageURL) return;

      img.style.backgroundImage = `url(${promo.imageURL})`;
      title.textContent = promo.description;
      discount.textContent = `${promo.discountRate}% OFF`;

      btn.onclick = () => {
        window.location.href =
          `/B/SG/furnitureProductDetails.html?sku=${promo.sku}`;
      };

      overlay.classList.remove("hidden");
      sessionStorage.setItem("promoShown", "true");
    })
    .catch(err => console.error("Promo popup failed:", err));

  closeBtn.addEventListener("click", () => {
    overlay.classList.add("hidden");
  });

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      overlay.classList.add("hidden");
    }
  });
});
