/*
 * QR Scanner Mobile Web
 *
 * QUAN TRỌNG:
 * 1. Tạo Google Apps Script Web App nhận POST.
 * 2. Dán URL Web App vào GOOGLE_SCRIPT_URL bên dưới.
 * 3. Trang web phải chạy HTTPS để camera hoạt động trên điện thoại.
 */

const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzbyNgFF7KvRQ1bQT0lx0Ucpr_TgwJ503Jd-upxm_kb0DTMa3cniGCdJc5AlbvNhXgY/exec";

let scanner = null;
let scanning = false;
let lastScanned = "";
let lastScanAt = 0;

const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const qrResult = document.getElementById("qrResult");
const saveStatus = document.getElementById("saveStatus");
const readerMessage = document.getElementById("readerMessage");
const statusDot = document.getElementById("statusDot");

function setStatus(message, type = "") {
    saveStatus.textContent = message;
    saveStatus.className = `save-status ${type}`;
}

function setScanningUI(active) {
    scanning = active;
    startBtn.disabled = active;
    stopBtn.disabled = !active;
    statusDot.classList.toggle("active", active);
    readerMessage.textContent = active
        ? "Đưa mã QR vào khung để quét"
        : "Nhấn “Bắt đầu quét” để mở camera";
}

async function startScanner() {
    try {
        if (!window.Html5Qrcode) {
            throw new Error("Không tải được thư viện QR Scanner.");
        }

        if (scanner) {
            await scanner.clear().catch(() => {});
        }

        scanner = new Html5Qrcode("reader");

        const config = {
            fps: 10,
            qrbox: { width: 240, height: 240 },
            aspectRatio: 1
        };

        // Ưu tiên camera sau trên điện thoại.
        await scanner.start(
            { facingMode: "environment" },
            config,
            onScanSuccess,
            onScanFailure
        );

        setScanningUI(true);
        setStatus("Camera đang hoạt động");
    } catch (error) {
        console.error(error);
        setScanningUI(false);
        setStatus(
            "Không mở được camera. Hãy cấp quyền camera và dùng HTTPS.",
            "error"
        );
    }
}

async function stopScanner() {
    try {
        if (scanner && scanning) {
            await scanner.stop();
        }
        if (scanner) {
            await scanner.clear().catch(() => {});
        }
    } catch (error) {
        console.warn(error);
    } finally {
        scanner = null;
        setScanningUI(false);
        setStatus("Đã dừng camera");
    }
}

function onScanFailure() {
    // Không hiển thị lỗi liên tục để giao diện không bị nhấp nháy.
}

async function onScanSuccess(decodedText) {
    const now = Date.now();

    // Chống gửi trùng cùng một mã trong 2 giây.
    if (decodedText === lastScanned && now - lastScanAt < 2000) {
        return;
    }

    lastScanned = decodedText;
    lastScanAt = now;

    qrResult.textContent = decodedText;
    setStatus("Đang lưu dữ liệu...");

    // Tạm dừng để tránh quét liên tục.
    await stopScanner();
    await saveToGoogleSheet(decodedText);
}

async function saveToGoogleSheet(qrCode) {
    if (!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL.includes("YOUR_GOOGLE")) {
        setStatus("Chưa cấu hình URL Google Apps Script.", "error");
        return;
    }

    const payload = {
        qr: qrCode,
        timestamp: new Date().toISOString()
    };

    try {
        /*
         * mode: no-cors phù hợp với Google Apps Script Web App.
         * Vì no-cors không đọc được response, chỉ coi việc request hoàn tất
         * là thành công ở phía trình duyệt.
         */
        await fetch(GOOGLE_SCRIPT_URL, {
            method: "POST",
            mode: "no-cors",
            headers: {
                "Content-Type": "text/plain;charset=utf-8"
            },
            body: JSON.stringify(payload)
        });

        setStatus("Đã gửi dữ liệu lên Google Sheets ✓", "success");
    } catch (error) {
        console.error(error);
        setStatus("Gửi dữ liệu thất bại. Vui lòng thử lại.", "error");
    }
}

startBtn.addEventListener("click", startScanner);
stopBtn.addEventListener("click", stopScanner);

window.addEventListener("pagehide", () => {
    if (scanner && scanning) {
        scanner.stop().catch(() => {});
    }
});
