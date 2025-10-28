import { useRef } from 'react';
import { Download } from 'lucide-react';
import logo from '../../../assets/logo.png';
import printLogo from '../../../assets/print-logo.png';

export interface TransactionReceiptProps {
  transactionData: {
    customer_id: number;
    transaction_id: number;
    order_id?: string;
    mobile: string;
    bbps_ref_no: string;
    category: string;
    biller_name: string;
    bill_amount: string;
    mode: string;
    status: string;
    biller_status: string;
    created_at: string;
    updated_at: string;
    account_no: string;
    biller_id: string;
    pg_txn_ref_id: string;
    authenticators: Array<{ value: string; parameter_name: string }>;
  };
}

export default function TransactionReceipt({ transactionData }: TransactionReceiptProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  
  // Debug: Check what data we're receiving
  console.log('Transaction Data:', transactionData);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatMode = (mode: string) => {
    return mode?.toUpperCase();
  };



  const handleDownload = async () => {
    if (!receiptRef.current) return;
    
    try {
      // Use browser's native print functionality to generate PDF
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert('Please allow popups to download PDF');
        return;
      }

      // Get all stylesheets from the current document
      const stylesheets = Array.from(document.styleSheets)
        .map(styleSheet => {
          try {
            return Array.from(styleSheet.cssRules)
              .map(rule => rule.cssText)
              .join('\n');
          } catch (e) {
            // Handle CORS issues with external stylesheets
            return '';
          }
        })
        .join('\n');

      // Get the receipt content
      const receiptContent = receiptRef.current.innerHTML;
      
      // Create the print document with all styles
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Order Receipt - ${transactionData.order_id || transactionData.transaction_id}</title>
          <meta charset="utf-8">
          <style>
            ${stylesheets}
            
            @page {
              margin: 0.5cm;
              size: A4;
            }
            
            body {
              margin: 0;
              padding: 0;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: white;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
              height: 100vh;
              overflow: hidden;
            }
            
            .print-container {
              max-width: 100%;
              margin: 0;
              padding: 0;
              background: white;
              height: 100vh;
              display: flex;
              flex-direction: column;
            }
            
            /* Ensure all colors are preserved in print */
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            
            @media print {
              @page {
                margin: 0.5cm;
                size: A4;
              }
              
              body {
                margin: 0;
                padding: 0;
                height: auto;
                overflow: visible;
              }
              
              .print-container {
                height: auto;
                margin: 0;
                padding: 0;
              }
              
              .print-hidden {
                display: none !important;
              }
              
              /* Hide action buttons in print */
              .print\\:hidden {
                display: none !important;
              }
              
              /* Remove extra spacing */
              .min-h-screen {
                min-height: auto !important;
              }
              
              /* Ensure receipt fits on page */
              .max-w-4xl {
                max-width: 100% !important;
                margin: 0 !important;
              }
            }
          </style>
        </head>
        <body>
          <div class="print-container">
            ${receiptContent}
          </div>
        </body>
        </html>
      `);
      
      printWindow.document.close();
      
      // Wait for content to load, then trigger print dialog
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          // Close the window after printing
          setTimeout(() => {
            printWindow.close();
          }, 1000);
        }, 500);
      };
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to download PDF. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Action Buttons */}
        <div className="mb-4 flex gap-3 print:hidden">
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Download size={20} />
            Download Receipt
          </button>
        </div>

        {/* Receipt */}
        <div
          ref={receiptRef}
          className="bg-white rounded-lg shadow-lg p-8 print:shadow-none print:rounded-none"
        >
          {/* Company Header */}
          <div className="text-center mb-6 pb-4 border-b-2 border-gray-300 relative">
            <style>{`
              .top-right-print-logo { display: none; }
              @media print {
                .top-right-print-logo {
                  display: block;
                  position: absolute;
                  top: 16px;
                  right: 16px;
                  width: 120px;
                  height: auto;
                }
              }
            `}</style>

            <div className="flex items-center justify-center gap-3 mb-2">
              <img
                src={logo}
                alt="Stashfin Logo"
                width={150}
                height={50}
                className="rounded-md"
              />
            </div>

            {/* Print-only top-right logo */}
            <img src={printLogo} alt="Stashfin Logo" className="top-right-print-logo" />
          </div>

          {/* Receipt Details */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-4">Transaction Receipt</h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Order Id</p>
                  <p className="font-semibold text-gray-800">{transactionData.order_id || transactionData.transaction_id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Receipt Date</p>
                  <p className="font-semibold text-gray-800">{formatDate(transactionData.updated_at)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* User Details Section */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-3 border-b border-gray-200 pb-2">
              User Details
            </h2>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <p className="text-sm text-gray-600">Contact</p>
                <p className="font-medium text-gray-800">{transactionData.mobile}</p>
              </div>
            </div>
          </div>

          {/* Service Details Section */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-3 border-b border-gray-200 pb-2">
              {transactionData.category} {['mobile prepaid', 'fastag'].includes(transactionData.category?.toLowerCase()) ? 'Recharge' : 'Bill Payment'}
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Operator Name</p>
                <p className="font-medium text-gray-800">{transactionData.biller_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">
                  {transactionData.authenticators[0]?.parameter_name || 'Account Number'}
                </p>
                <p className="font-medium text-gray-800">{transactionData.account_no}</p>
              </div>
            </div>
          </div>

          {/* Transaction Information Section */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-3 border-b border-gray-200 pb-2">
              Transaction Information
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600">Amount Paid</p>
                <p className="text-2xl font-bold text-green-600">₹{transactionData.bill_amount}</p>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600">Payment Method</p>
                <p className="font-medium text-gray-800">{formatMode(transactionData.mode)}</p>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600">Transaction Reference Id</p>
                <p className="font-medium text-gray-800">{transactionData.pg_txn_ref_id}</p>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600">BBPS Reference Id</p>
                <p className="font-medium text-gray-800">{transactionData.bbps_ref_no}</p>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600">Status</p>
                <p className="font-medium text-green-600 capitalize">{transactionData.status}</p>
              </div>
            </div>
          </div>

          {/* Red Strip at Bottom */}
          <div className="bg-red-600 -mx-8 -mb-8 h-3 mt-6 relative">
            {/* Computer Generated Receipt Note */}
            <div className="absolute -top-12 left-0 right-0 text-center">
              <p className="text-sm text-gray-600 font-medium">
                <span className="font-semibold">Note:</span> This is a computer generated receipt and does not require physical signature
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
          @page {
            margin: 1cm;
          }
        }
      `}</style>
    </div>
  );
}