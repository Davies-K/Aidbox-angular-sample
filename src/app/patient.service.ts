
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { Observable, of } from 'rxjs';

import { Store } from '@ngrx/store';
import { AppState } from './reducer';
import { LOADING, RECEIVE, APPEND, DELETE, UPDATE,
         SELECT_PATIENT } from './reducer/patient';

import { Patient } from './patient';
import { objectToFhir, fhirToObject } from './patient.converter';
import { environment } from '../../environment';

const httpOptions = {
  headers: new HttpHeaders({'Content-Type': 'application/json'})
};


export const defaultCount: number = 10;


@Injectable({
  providedIn: 'root'
})
export class PatientService {

  baseURL:string = environment.AIDBOX_URL;

  constructor(
    private http: HttpClient,
    private store: Store<AppState>
  ) { }

  getPatients(patientName = '', page = 1, count = defaultCount): void {
    let url = `Patient?_page=${page}&_count=${count}`;
    if (patientName && patientName.length >= 0) {
      url += `&name=${patientName}`;
    }
    this.getPatientsByUrl(url);
  }

  getPatientsByUrl(url: string): void {
    let fullUrl = `${this.baseURL}/fhir/${url}`;
    this.store.dispatch({ type: LOADING });
    const query = new URL(fullUrl).search;
    const page = new URLSearchParams(query).get('_page');
    this.http.get(fullUrl).subscribe(patients => {
      this.store.dispatch({
        type: RECEIVE,
        data: patients["entry"].map(p => fhirToObject(p.resource)),
        count: patients["total"],
        link: patients["link"],
        currentPage: Number(page)
      });
    });
  }

  addPatient(patient: Patient): void {
    const url = `${this.baseURL}/fhir/Patient`;
    const patientData = objectToFhir(patient);
    this.store.dispatch({ type: LOADING });
    this.http.post(url, patientData, httpOptions)
      .subscribe(p => {
        patient.id = p["id"];
        this.store.dispatch({ type: APPEND, data: [patient] });
        this.store.dispatch({ type: SELECT_PATIENT, selectedPatientId: patient.id })
      });
  };

  deletePatient(patient: Patient): void {
    const url = `${this.baseURL}/fhir/Patient/${patient.id}`;
    this.store.dispatch({ type: LOADING });
    this.http.delete(url, httpOptions)
      .subscribe(p => {
        this.store.dispatch({ type: DELETE, data: [patient] });
      });
  }

  updatePatient(patient: Patient): void {
    const url = `${this.baseURL}/fhir/Patient/${patient.id}`;
    const patientData = objectToFhir(patient);
    this.store.dispatch({ type: LOADING });
    this.http.put(url, patientData, httpOptions)
      .subscribe(p => {
        this.store.dispatch({ type: UPDATE, data: [patient]});
      });
  }

  selectPatient(id: number): void {
    this.store.dispatch({ type: SELECT_PATIENT, selectedPatientId: id });
  }

}
