
export const generatePDF = (elementId: string, fileName: string) => {
    const element = document.getElementById(elementId);
    if (!element) {
        console.error(`Element with id ${elementId} not found`);
        return;
    }

    // Add styling class to force light mode
    element.classList.add('pdf-export-mode');

    const opt = {
        margin: [10, 10, 10, 10], // top, left, bottom, right
        filename: fileName,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
            scale: 2, 
            useCORS: true, 
            logging: false,
            backgroundColor: '#ffffff'
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // @ts-ignore
    if (window.html2pdf) {
        // @ts-ignore
        window.html2pdf().set(opt).from(element).save().then(() => {
            // Cleanup: remove the class after generation
            element.classList.remove('pdf-export-mode');
        }).catch((err: any) => {
            console.error('PDF Generation Error:', err);
            element.classList.remove('pdf-export-mode');
        });
    } else {
        alert('PDF Generator is initializing. Please try again in 5 seconds.');
        element.classList.remove('pdf-export-mode');
    }
};
