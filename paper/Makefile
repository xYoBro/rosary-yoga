# Rosary Yoga -- paper kit Makefile
#
# Targets:
#   make all      -- build manual, logbook (decade 3), codex
#   make manual   -- build paper/out/manual.pdf
#   make logbook  -- build paper/out/logbook-decade-3.pdf
#   make codex    -- build paper/out/codex.pdf
#   make clean    -- remove aux/log/intermediate files
#   make distclean -- also remove out/ PDFs
#
# Each target compiles the source to its native 5.5x8.5" trim, then runs
# the imposition shim (impose.tex) to wrap the interior 2-up on US Letter
# landscape for duplex printing.

PDFLATEX := pdflatex -interaction=nonstopmode -halt-on-error

OUT      := out
MANUAL   := manual/manual.tex
LOGBOOK  := logbook/booklet.tex
CODEX    := codex/codex.tex

.PHONY: all manual logbook codex clean distclean

all: manual logbook codex

# ---- Manual ---------------------------------------------------------------
manual: $(OUT)/manual.pdf

$(OUT)/manual-interior.pdf: $(MANUAL) | $(OUT)
	cd manual && $(PDFLATEX) manual.tex
	cd manual && $(PDFLATEX) manual.tex   # second pass for any refs
	cp manual/manual.pdf $@

$(OUT)/manual.pdf: $(OUT)/manual-interior.pdf
	$(PDFLATEX) -jobname=manual-imposed \
	  "\def\inputpdf{$(OUT)/manual-interior.pdf}\input{impose.tex}"
	mv manual-imposed.pdf $@
	rm -f manual-imposed.aux manual-imposed.log

# ---- Logbook (Decade 3 by default) ---------------------------------------
logbook: $(OUT)/logbook-decade-3.pdf

$(OUT)/logbook-decade-3-interior.pdf: $(LOGBOOK) logbook/beads.csv | $(OUT)
	cd logbook && $(PDFLATEX) booklet.tex
	cd logbook && $(PDFLATEX) booklet.tex
	cp logbook/booklet.pdf $@

$(OUT)/logbook-decade-3.pdf: $(OUT)/logbook-decade-3-interior.pdf
	$(PDFLATEX) -jobname=logbook-imposed \
	  "\def\inputpdf{$(OUT)/logbook-decade-3-interior.pdf}\input{impose.tex}"
	mv logbook-imposed.pdf $@
	rm -f logbook-imposed.aux logbook-imposed.log

# ---- Codex ---------------------------------------------------------------
codex: $(OUT)/codex.pdf

$(OUT)/codex-interior.pdf: $(CODEX) codex/bosses.dat | $(OUT)
	cd codex && $(PDFLATEX) codex.tex
	cd codex && $(PDFLATEX) codex.tex
	cp codex/codex.pdf $@

$(OUT)/codex.pdf: $(OUT)/codex-interior.pdf
	$(PDFLATEX) -jobname=codex-imposed \
	  "\def\inputpdf{$(OUT)/codex-interior.pdf}\input{impose.tex}"
	mv codex-imposed.pdf $@
	rm -f codex-imposed.aux codex-imposed.log

# ---- Housekeeping --------------------------------------------------------
$(OUT):
	mkdir -p $(OUT)

clean:
	rm -f manual/*.aux manual/*.log manual/*.out manual/manual.pdf
	rm -f logbook/*.aux logbook/*.log logbook/*.out logbook/booklet.pdf
	rm -f codex/*.aux codex/*.log codex/*.out codex/codex.pdf
	rm -f *.aux *.log *-imposed.pdf

distclean: clean
	rm -rf $(OUT)
