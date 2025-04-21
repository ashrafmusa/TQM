from flask import Flask, render_template, send_from_directory, request, flash, redirect, url_for, abort, make_response
from fpdf import FPDF
import datetime
import os
import logging

# --- Configuration ---
UPLOAD_FOLDER = 'uploads'
basedir = os.path.abspath(os.path.dirname(__file__))
app = Flask(__name__, template_folder=os.path.join(basedir, 'templates'), static_folder=os.path.join(basedir, 'static'))
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['SECRET_KEY'] = os.environ.get('FLASK_SECRET_KEY', 'a_very_strong_secret_key_please_change')

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s: %(message)s [%(pathname)s:%(lineno)d]')

# --- Context Processor ---
@app.context_processor
def inject_now():
    """
    Injects the current datetime into all templates for use in displaying the year or other time-based elements.
    """
    return {'now': datetime.datetime.now()}


# --- Routes ---
@app.route('/')
def index():
    app.logger.info("Rendering index page.")
    return render_template('index.html')


@app.route('/define')
def define_phase():
    app.logger.info("Rendering define phase page.")
    return render_template('define_phase.html')


@app.route('/measure')
def measure_phase():
    app.logger.info("Rendering measure phase page.")
    return render_template('measure_phase.html')


@app.route('/analyze')
def analyze_phase():
    app.logger.info("Rendering analyze phase page.")
    return render_template('analyze_phase.html')


@app.route('/improve')
def improve_phase():
    app.logger.info("Rendering improve phase page.")
    return render_template('improve_phase.html')


@app.route('/control')
def control_phase():
    app.logger.info("Rendering control phase page.")
    return render_template('control_phase.html')


@app.route('/graphical-forms')
def graphical_forms():
    app.logger.info("Rendering graphical forms page.")
    return render_template('graphical-forms.html')


@app.route('/capability-calculator')
def capability_calculator_page():
    app.logger.info("Rendering capability calculator page.")
    return render_template('capability_calculator.html')


@app.route('/import-data', methods=['GET', 'POST'])
def import_data():
    app.logger.info("Rendering import data page.")
    if request.method == 'POST':
        # Handle file upload logic here
        flash("Data imported successfully!", "success")
        return redirect(url_for('measure_phase'))
    return render_template('import_data.html')


@app.route('/nonconformance', methods=['GET', 'POST'])
def nonconformance_form_page():
    app.logger.info("Rendering nonconformance form page.")
    if request.method == 'POST':
        app.logger.info("Form submitted for Nonconformance Report.")
        flash("Nonconformance form submitted successfully!", "success")
        return redirect(url_for('nonconformance_form_page'))
    return render_template('nonconformance_form.html')


@app.route('/export/nonconformance/pdf', methods=['POST'])
def export_nonconformance_pdf():
    """
    Exports the Nonconformance Form data as a PDF.
    """
    form_data = request.form
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", size=12)

    # Add Title
    pdf.set_font("Arial", style='B', size=16)
    pdf.cell(200, 10, txt="Nonconformance Report", ln=True, align='C')
    pdf.ln(10)

    # Add Form Data
    pdf.set_font("Arial", size=12)
    pdf.cell(200, 10, txt=f"Fault Category: {form_data.get('nc_fault_category', 'N/A')}", ln=True)
    pdf.cell(200, 10, txt=f"Initiator Name: {form_data.get('nc_initiator_name', 'N/A')}", ln=True)
    pdf.cell(200, 10, txt=f"Details: {form_data.get('nc_details', 'N/A')}", ln=True)
    pdf.cell(200, 10, txt=f"Date Fault Occurred: {form_data.get('nc_fault_occurred_date', 'N/A')}", ln=True)
    pdf.ln(5)

    response = make_response(pdf.output(dest='S').encode('latin1'))
    response.headers['Content-Type'] = 'application/pdf'
    response.headers['Content-Disposition'] = 'attachment; filename=nonconformance_report.pdf'
    app.logger.info("Nonconformance form exported as PDF.")
    return response


@app.route('/favicon.ico')
def favicon():
    """
    Serves the favicon.ico file.
    """
    return send_from_directory(
        os.path.join(app.static_folder, 'images'),
        'favicon.ico',
        mimetype='image/vnd.microsoft.icon'
    )


# --- Error Handlers ---
@app.errorhandler(404)
def page_not_found(e):
    app.logger.warning("Page not found: %s", request.url)
    return render_template('404.html'), 404


@app.errorhandler(500)
def internal_server_error(e):
    app.logger.error("Internal server error: %s", request.url, exc_info=True)
    return render_template('500.html'), 500


# --- Catch-All Route for Undefined Routes ---
@app.route('/<path:undefined_route>')
def catch_all(undefined_route):
    app.logger.warning("Attempted to access undefined route: %s", undefined_route)
    abort(404)


# --- Run Application ---
if __name__ == '__main__':
    is_debug = os.environ.get('FLASK_DEBUG', '1').lower() in ['true', '1', 't']
    host = os.environ.get('FLASK_RUN_HOST', '127.0.0.1')
    port = int(os.environ.get('FLASK_RUN_PORT', 5000))
    app.logger.info(f"Starting Flask app on http://{host}:{port}/ debug={is_debug}")
    app.run(host=host, port=port, debug=is_debug, use_reloader=is_debug)